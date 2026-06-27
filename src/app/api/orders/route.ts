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
    include: { items: { include: { product: true, animal: true } } }
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

    if (coupon && coupon.isActive && new Date(coupon.endDate) >= new Date()) {
      let applicableSubtotal = 0;

      if (coupon.shopId) {
        // เฉพาะสินค้าของร้านค้านั้น ๆ
        const shopItems = cart.items.filter(
          (it) => it.product && it.product.shopId === coupon.shopId
        );
        applicableSubtotal = shopItems.reduce((s, it) => s + (it.product?.price || 0) * it.quantity, 0);
      } else {
        // ส่วนกลาง ใช้ได้กับทั้งหมด
        applicableSubtotal = total;
      }

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
    return created;
  });

  return NextResponse.json({ ok: true, id: order.id });
}
