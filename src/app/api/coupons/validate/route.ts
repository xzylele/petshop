import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json().catch(() => ({}));
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

    let subtotal = 0;

    if (coupon.shopId) {
      // คูปองเฉพาะร้านค้า: คำนวณยอดเฉพาะสินค้าที่เป็นของร้านค้านั้น ๆ
      const shopItems = cart.items.filter(
        (it) => it.product && it.product.shopId === coupon.shopId
      );

      if (shopItems.length === 0) {
        return NextResponse.json({
          error: `คูปองนี้ใช้ได้เฉพาะกับสินค้าของร้าน "${coupon.shop?.name || 'ร้านค้าเฉพาะ'}" เท่านั้น`
        }, { status: 400 });
      }

      subtotal = shopItems.reduce((s, it) => s + (it.product?.price || 0) * it.quantity, 0);
    } else {
      // คูปองส่วนลดกลางของแพลตฟอร์ม: ใช้ได้กับสินค้าทั้งหมดในตะกร้า
      subtotal = cart.items.reduce(
        (s, it) => s + (it.product?.price ?? it.animal?.price ?? 0) * it.quantity,
        0
      );
    }

    if (subtotal < coupon.minPurchase) {
      return NextResponse.json({
        error: `ยอดซื้อสินค้าที่ร่วมรายการไม่ถึงเกณฑ์ขั้นต่ำ (ยอดปัจจุบัน: ${subtotal} บาท | ขั้นต่ำ: ${coupon.minPurchase} บาท)`
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

    // ส่วนลดต้องไม่เกินยอดสินค้า
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
      shopName: coupon.shop?.name || null
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
