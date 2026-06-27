import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CouponSchema = z.object({
  code: z.string().min(1, "รหัสคูปองต้องไม่ว่างเปล่า").transform(val => val.toUpperCase().trim()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive("มูลค่าส่วนลดต้องมากกว่า 0"),
  minPurchase: z.number().nonnegative().optional().default(0),
  maxDiscount: z.number().positive().nullable().optional(),
  endDate: z.string().transform(val => new Date(val)),
  allowedCategory: z.enum(["ALL", "PRODUCT", "ANIMAL", "SERVICE"]).optional().default("ALL")
});

// GET: ดึงคูปองของร้านค้าตัวเอง
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!shop) {
      return NextResponse.json({ error: "ไม่พบข้อมูลร้านค้า" }, { status: 400 });
    }

    const coupons = await prisma.coupon.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: สร้างคูปองใหม่สำหรับร้านค้า
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!shop) {
      return NextResponse.json({ error: "ไม่พบข้อมูลร้านค้า" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = CouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { code, discountType, discountValue, minPurchase, maxDiscount, endDate, allowedCategory } = parsed.data;

    // ตรวจสอบว่ามีคูปองรหัสนี้ซ้ำในระบบหรือไม่
    const existing = await prisma.coupon.findUnique({
      where: { code }
    });
    if (existing) {
      return NextResponse.json({ error: "รหัสคูปองนี้ถูกใช้งานในระบบแล้ว" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount,
        endDate,
        allowedCategory,
        shopId: shop.id
      }
    });

    return NextResponse.json({ ok: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
