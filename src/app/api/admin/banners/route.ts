import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BannerSchema = z.object({
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  imageUrl: z.string().min(1, "กรุณาระบุรูปภาพแบนเนอร์"),
  linkUrl: z.string().optional().default(""),
  order: z.number().int().optional().default(0)
});

// GET: ดึงรายการแบนเนอร์ทั้งหมด (สำหรับแอดมินหรือหน้าบ้านทั่วไป)
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json({ banners });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: เพิ่มแบนเนอร์สไลด์ใหม่ (เฉพาะแอดมิน)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const rawData = await req.json().catch(() => null);
    const parsed = BannerSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: parsed.data
    });

    return NextResponse.json({ ok: true, banner });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
