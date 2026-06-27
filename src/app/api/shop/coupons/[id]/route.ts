import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateCouponSchema = z.object({
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive("มูลค่าส่วนลดต้องมากกว่า 0"),
  minPurchase: z.number().nonnegative().optional().default(0),
  maxDiscount: z.number().positive().nullable().optional(),
  endDate: z.string().transform(val => new Date(val)),
  isActive: z.boolean().optional(),
  allowedCategory: z.enum(["ALL", "PRODUCT", "ANIMAL", "SERVICE"]).optional()
});

// PUT: อัปเดตคูปอง
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const shop = await prisma.shop.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!shop) {
      return NextResponse.json({ error: "ไม่พบข้อมูลร้านค้า" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon || coupon.shopId !== shop.id) {
      return NextResponse.json({ error: "ไม่พบคูปองส่วนลดนี้ในร้านค้าของคุณ" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = UpdateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ ok: true, coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: ลบคูปอง
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const shop = await prisma.shop.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!shop) {
      return NextResponse.json({ error: "ไม่พบข้อมูลร้านค้า" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon || coupon.shopId !== shop.id) {
      return NextResponse.json({ error: "ไม่พบคูปองส่วนลดนี้ในร้านค้าของคุณ" }, { status: 404 });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
