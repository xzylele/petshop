// API แอดมิน: ปฏิเสธการชำระเงิน
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// PUT: เปลี่ยนสถานะการชำระเงินเป็น REJECTED
export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  await prisma.payment.update({ where: { id }, data: { status: "REJECTED" } });
  return NextResponse.json({ ok: true });
}
