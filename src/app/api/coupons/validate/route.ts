import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { code, isBooking, bookingPrice, shopId } = await req.json().catch(() => ({}));
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "กรุณาระบุรหัสคูปอง" }, { status: 400 });
    }

    const couponCode = code.toUpperCase().trim();

    // ค้นหาคูปอง
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
      include: { shop: { select: { name: true } } }
    });

    if (!coupon) {
      return NextResponse.json({ error: "ไม่พบรหัสคูปองนี้ในระบบ" }, { status: 400 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "คูปองส่วนลดนี้ปิดการใช้งานชั่วคราว" }, { status: 400 });
    }

    if (new Date(coupon.endDate) < new Date()) {
      return NextResponse.json({ error: "คูปองส่วนลดนี้หมดอายุแล้ว" }, { status: 400 });
    }

    let subtotal = 0;

    if (isBooking) {
      // ตรวจสอบคูปองสำหรับบริการจองคิว
      if (coupon.allowedCategory !== "SERVICE" && coupon.allowedCategory !== "ALL") {
        return NextResponse.json({ error: "คูปองส่วนลดนี้ไม่สามารถใช้กับบริการจองคิวได้" }, { status: 400 });
      }

      // ถ้าเป็นคูปองร้านค้า ต้องตรงกับร้านที่จอง
      if (coupon.shopId && coupon.shopId !== shopId) {
        return NextResponse.json({
          error: `คูปองนี้ใช้ได้เฉพาะกับบริการของร้าน "${coupon.shop?.name || 'ร้านค้าเฉพาะ'}" เท่านั้น`
        }, { status: 400 });
      }

      subtotal = Number(bookingPrice) || 0;
    } else {
      // ตรวจสอบคูปองสำหรับสินค้า/สัตว์เลี้ยงในตะกร้า
      if (coupon.allowedCategory === "SERVICE") {
        return NextResponse.json({ error: "คูปองนี้ใช้ได้เฉพาะกับบริการจองคิวเท่านั้น" }, { status: 400 });
      }

      // ดึงสินค้าในตะกร้าของผู้ใช้เพื่อคำนวณยอดซื้อ
      const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              product: true,
              animal: true
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: "ไม่พบสินค้าในตะกร้า" }, { status: 400 });
      }

      // กรองตามร้านค้าก่อน (ถ้ามี shopId)
      let applicableItems = cart.items;
      if (coupon.shopId) {
        applicableItems = applicableItems.filter(
          (it) => it.product && it.product.shopId === coupon.shopId
        );
        if (applicableItems.length === 0) {
          return NextResponse.json({
            error: `คูปองนี้ใช้ได้เฉพาะกับสินค้าของร้าน "${coupon.shop?.name || 'ร้านค้าเฉพาะ'}" เท่านั้น`
          }, { status: 400 });
        }
      }

      // กรองตามหมวดหมู่การลด (allowedCategory)
      if (coupon.allowedCategory === "PRODUCT") {
        applicableItems = applicableItems.filter((it) => it.product);
        if (applicableItems.length === 0) {
          return NextResponse.json({ error: "คูปองส่วนลดนี้ใช้ได้กับสินค้าในร้านเท่านั้น (ไม่รวมสัตว์เลี้ยง)" }, { status: 400 });
        }
      } else if (coupon.allowedCategory === "ANIMAL") {
        applicableItems = applicableItems.filter((it) => it.animal);
        if (applicableItems.length === 0) {
          return NextResponse.json({ error: "คูปองส่วนลดนี้ใช้ได้กับสัตว์เลี้ยงเท่านั้น (ไม่รวมสินค้าอื่น)" }, { status: 400 });
        }
      }

      subtotal = applicableItems.reduce(
        (s, it) => s + (it.product?.price ?? it.animal?.price ?? 0) * it.quantity,
        0
      );
    }

    if (subtotal < coupon.minPurchase) {
      return NextResponse.json({
        error: `ยอดซื้อสินค้า/บริการที่ร่วมรายการไม่ถึงเกณฑ์ขั้นต่ำ (ยอดปัจจุบัน: ${subtotal} บาท | ขั้นต่ำ: ${coupon.minPurchase} บาท)`
      }, { status: 400 });
    }

    // คำนวณยอดส่วนลด
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    // ส่วนลดต้องไม่เกินยอดสินค้า/บริการ
    if (discount > subtotal) {
      discount = subtotal;
    }

    return NextResponse.json({
      ok: true,
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      shopId: coupon.shopId,
      shopName: coupon.shop?.name || null,
      allowedCategory: coupon.allowedCategory
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
