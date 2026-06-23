// API ร้านค้า: บันทึกโปรไฟล์ร้าน
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  province: z.string().optional().default(""),
  coverUrl: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  allowsGrooming: z.boolean().optional().default(false),
  allowsBoarding: z.boolean().optional().default(false)
});

// PUT: สร้างหรืออัปเดตร้านค้าของผู้ใช้
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SHOP_OWNER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.shop.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    await prisma.shop.update({ where: { id: existing.id }, data: parsed.data });
  } else {
    await prisma.shop.create({ data: { ...parsed.data, ownerId: session.user.id, status: "PENDING" } });
  }

  return NextResponse.json({ ok: true });
}
