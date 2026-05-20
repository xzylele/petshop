// API แอดมิน: ระงับร้านค้า
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// PUT: เปลี่ยนสถานะร้านเป็น SUSPENDED
export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  await prisma.shop.update({ where: { id }, data: { status: "SUSPENDED" } });
  return NextResponse.json({ ok: true });
}
