import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateCouponSchema = z.object({
  code: z
    .string()
    .min(1, "กรุณากรอกรหัสคูปอง")
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().positive("มูลค่าส่วนลดต้องมากกว่า 0").optional(),
  minPurchase: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional().nullable(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  isActive: z.boolean().optional(),
  allowedCategory: z.enum(["ALL", "PRODUCT", "ANIMAL", "SERVICE"]).optional()
});

// PUT: แก้ไขข้อมูลคูปองส่วนลดกลาง (เฉพาะแอดมิน)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const rawData = await req.json().catch(() => null);
    const parsed = UpdateCouponSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ error: "ไม่พบคูปองนี้ในระบบ" }, { status: 404 });
    }

    // หากต้องการเปลี่ยนโค้ด ตรวจสอบว่าโค้ดใหม่ซ้ำหรือไม่
    if (parsed.data.code && parsed.data.code !== coupon.code) {
      const existing = await prisma.coupon.findUnique({
        where: { code: parsed.data.code }
      });
      if (existing) {
        return NextResponse.json(
          { error: `รหัสคูปอง "${parsed.data.code}" นี้ถูกใช้งานในระบบแล้ว` },
          { status: 400 }
        );
      }
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

// DELETE: ลบคูปองส่วนลดกลาง (เฉพาะแอดมิน)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ error: "ไม่พบคูปองนี้ในระบบ" }, { status: 404 });
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
