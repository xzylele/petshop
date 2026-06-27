// API คำสั่งซื้อ: สร้างออเดอร์จากตะกร้า พร้อมคิดคูปองส่วนลดและคะแนนสะสม
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  address: z.string().min(5),
  note: z.string().optional().default(""),
  method: z.enum(["QR_CODE", "BANK_TRANSFER"]),
  couponCode: z.string().nullable().optional(),
  usePoints: z.boolean().optional().default(false)
});

// POST: สร้างคำสั่งซื้อ + ตรวจสอบคูปองและพอยท์สะสม + หักสต็อก + เคลียร์ตะกร้า
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const { address, note, method, couponCode, usePoints } = parsed.data;

  // ดึงข้อมูลผู้ใช้เพื่อเช็คแต้ม
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  if (!user) return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 404 });

  // ดึงตะกร้าสินค้า
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              shop: {
                select: {
                  ownerId: true
                }
              }
            }
          },
          animal: true
        }
      }
    }
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "ตะกร้าว่าง" }, { status: 400 });
  }

  // คำนวณรายอาร์เรย์และยอดสินค้าทั้งหมด
  let total = 0;
  const orderItems: { productId?: string; animalId?: string; name: string; quantity: number; price: number }[] = [];

  for (const it of cart.items) {
    if (it.product) {
      if (it.product.stock < it.quantity) {
        return NextResponse.json({ error: `สินค้า ${it.product.name} ไม่เพียงพอ` }, { status: 400 });
      }
      total += it.product.price * it.quantity;
      orderItems.push({
        productId: it.productId!,
        name: it.product.name,
        quantity: it.quantity,
        price: it.product.price
      });
    } else if (it.animal) {
      if (it.animal.status !== "ACTIVE") {
        return NextResponse.json({ error: `สัตว์เลี้ยง ${it.animal.name ?? it.animal.animalType} ไม่พร้อมขาย` }, { status: 400 });
      }
      total += it.animal.price;
      orderItems.push({
        animalId: it.animalId!,
        name: it.animal.name ?? it.animal.animalType,
        quantity: 1,
        price: it.animal.price
      });
    }
  }

  // --- 1. ตรวจสอบคูปองส่วนลดในฝั่งหลังบ้าน (Backend Validation) ---
  let discount = 0;
  let validatedCouponCode: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase().trim() }
    });

    if (
      coupon &&
      coupon.isActive &&
      new Date(coupon.endDate) >= new Date() &&
      coupon.allowedCategory !== "SERVICE" // คูปองประเภทบริการใช้ในการสั่งซื้อสินค้าไม่ได้
    ) {
      let applicableItems = cart.items;

      // กรองเฉพาะร้านค้า (ถ้าผูกกับร้านค้า)
      if (coupon.shopId) {
        applicableItems = applicableItems.filter(
          (it) => it.product && it.product.shopId === coupon.shopId
        );
      }

      // กรองตามหมวดหมู่
      if (coupon.allowedCategory === "PRODUCT") {
        applicableItems = applicableItems.filter((it) => it.product);
      } else if (coupon.allowedCategory === "ANIMAL") {
        applicableItems = applicableItems.filter((it) => it.animal);
      }

      const applicableSubtotal = applicableItems.reduce(
        (s, it) => s + (it.product?.price ?? it.animal?.price ?? 0) * it.quantity,
        0
      );

      if (applicableSubtotal >= coupon.minPurchase) {
        validatedCouponCode = coupon.code;
        if (coupon.discountType === "PERCENTAGE") {
          discount = (applicableSubtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }

        if (discount > applicableSubtotal) {
          discount = applicableSubtotal;
        }
      }
    }
  }

  // ยอดคงเหลือหลังหักส่วนลดคูปอง
  const subtotalAfterCoupon = Math.max(0, total - discount);

  // --- 2. คำนวณการใช้คะแนนสะสม ---
  let pointsUsed = 0;
  if (usePoints && user.points > 0) {
    pointsUsed = Math.min(user.points, subtotalAfterCoupon);
  }

  // ยอดชำระเงินสุดท้าย
  const finalTotal = Math.max(0, subtotalAfterCoupon - pointsUsed);

  // แต้มสะสมที่จะได้รับจากออเดอร์นี้ (5% ของยอดจ่ายจริง)
  const pointsEarned = Math.floor(finalTotal * 0.05);

  // ทำการบันทึกในฐานข้อมูลแบบ Transaction
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: session.user.id,
        total: finalTotal,
        discount,
        couponCode: validatedCouponCode,
        pointsUsed,
        pointsEarned,
        pointsCredited: false, // จะบวกแต้มให้เมื่อชำระเงินสำเร็จเท่านั้น
        address,
        note,
        status: "PENDING_PAYMENT",
        items: { create: orderItems },
        payment: { create: { method, amount: finalTotal, status: "PENDING" } }
      }
    });

    // หักคะแนนสะสมของผู้ใช้
    if (pointsUsed > 0) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { points: { decrement: pointsUsed } }
      });
    }

    // หักสต็อกสินค้า
    for (const it of cart.items) {
      if (it.product) {
        await tx.product.update({
          where: { id: it.productId! },
          data: { stock: { decrement: it.quantity } }
        });
      } else if (it.animal) {
        await tx.animal.update({
          where: { id: it.animalId! },
          data: { status: "RESERVED" }
        });
      }
    }

    // เคลียร์ตะกร้าสินค้า
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    // ส่งแจ้งเตือนถึงร้านค้าและแอดมิน
    try {
      const shopSales: Record<string, { ownerId: string; total: number }> = {};
      let hasAnimals = false;

      for (const it of cart.items) {
        if (it.product && it.product.shop) {
          const ownerId = it.product.shop.ownerId;
          const price = it.product.price * it.quantity;
          if (!shopSales[ownerId]) {
            shopSales[ownerId] = { ownerId, total: 0 };
          }
          shopSales[ownerId].total += price;
        } else if (it.animal) {
          hasAnimals = true;
        }
      }

      // 1. แจ้งเตือนเจ้าของร้านค้าต่าง ๆ
      for (const ownerId of Object.keys(shopSales)) {
        const sale = shopSales[ownerId];
        await tx.notification.create({
          data: {
            userId: sale.ownerId,
            title: "🚨 มีคำสั่งซื้อสินค้าใหม่เข้ามา!",
            message: `ออเดอร์ #${created.id.slice(-8)} มีสินค้าของคุณถูกสั่งซื้อรวม ${sale.total} บาท`,
            linkUrl: "/shop/orders"
          }
        });
      }

      // 2. แจ้งเตือนแอดมินถ้ามีสัตว์เลี้ยงถูกซื้อ
      if (hasAnimals) {
        const admins = await tx.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true }
        });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              title: "🦁 มีการซื้อสัตว์เลี้ยงใหม่!",
              message: `ออเดอร์ #${created.id.slice(-8)} มีการสั่งซื้อสัตว์เลี้ยงจากระบบ กรุณาตรวจสอบการจัดส่ง`,
              linkUrl: "/admin/orders"
            }
          });
        }
      }
    } catch (notifErr) {
      console.error("Error creating order notifications:", notifErr);
      // ไม่ย้อนกลับทรานแซกชันหลักหากแค่ส่งแจ้งเตือนล้มเหลว
    }

    return created;
  });

  return NextResponse.json({ ok: true, id: order.id });
}
