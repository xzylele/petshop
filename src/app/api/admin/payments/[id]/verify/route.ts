// API แอดมิน: ยืนยันการชำระเงินจากสลิป
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// PUT: เปลี่ยนสถานะการชำระเงินเป็น VERIFIED
export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;

  const payment = await prisma.payment.update({
    where: { id },
    data: { status: "VERIFIED", verifiedAt: new Date() }
  });
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: "PAID" }
  });
  return NextResponse.json({ ok: true });
}
