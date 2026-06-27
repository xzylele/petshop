import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CouponSchema = z.object({
  code: z
    .string()
    .min(1, "กรุณากรอกรหัสคูปอง")
    .transform((val) => val.toUpperCase().trim()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive("มูลค่าส่วนลดต้องมากกว่า 0"),
  minPurchase: z.number().nonnegative().default(0),
  maxDiscount: z.number().nonnegative().optional().nullable(),
  endDate: z.string().transform((val) => new Date(val)),
  isActive: z.boolean().default(true)
});

// GET: ดึงรายการคูปองส่วนลดกลางของระบบ (สำหรับแอดมิน)
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      where: { shopId: null }, // เฉพาะคูปองกลางที่ไม่ได้ผูกกับร้านค้าใด ๆ
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: เพิ่มคูปองส่วนลดกลางใหม่ (เฉพาะแอดมิน)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const rawData = await req.json().catch(() => null);
    const parsed = CouponSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { code } = parsed.data;

    // ตรวจสอบว่าโค้ดซ้ำหรือไม่
    const existing = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json(
        { error: `รหัสคูปอง "${code}" นี้ถูกใช้งานในระบบแล้ว` },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...parsed.data,
        shopId: null // ระบุเป็น null เพื่อประกาศเป็นคูปองกลางของทั้งระบบ
      }
    });

    return NextResponse.json({ ok: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
