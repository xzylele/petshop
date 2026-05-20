// API แอดมิน: อัปเดตสถานะผู้ใช้
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const Body = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]) });

// PUT: เปลี่ยน status ของผู้ใช้ตาม id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid status" }, { status: 400 });
  await prisma.user.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
