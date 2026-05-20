// API การชำระเงิน: อัปโหลดสลิปของคำสั่งซื้อ
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  slipUrl: z.string().url(),
  reference: z.string().optional().default("")
});

// POST: บันทึก slipUrl และอ้างอิง แล้วตั้งสถานะเป็น SUBMITTED
export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!order.payment) return NextResponse.json({ error: "no payment" }, { status: 400 });

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      slipUrl: parsed.data.slipUrl,
      reference: parsed.data.reference,
      status: "SUBMITTED",
      paidAt: new Date()
    }
  });

  return NextResponse.json({ ok: true });
}
