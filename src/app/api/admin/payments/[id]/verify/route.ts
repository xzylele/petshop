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

  const order = await prisma.order.findUnique({
    where: { id: payment.orderId }
  });

  if (order && !order.pointsCredited) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: order.userId },
        data: { points: { increment: order.pointsEarned } }
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", pointsCredited: true }
      })
    ]);
  } else {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" }
    });
  }

  // ส่งแจ้งเตือนเมื่อระบบอนุมัติการชำระเงินเรียบร้อย
  if (order) {
    try {
      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: "✅ ได้รับชำระเงินแล้ว",
          message: `ออเดอร์ #${order.id.slice(-8)} ได้รับการยืนยันชำระเงินเรียบร้อยแล้ว ร้านค้ากำลังดำเนินการเตรียมจัดส่ง`,
          linkUrl: `/orders/${order.id}`
        }
      });
    } catch (notifErr) {
      console.error("Error creating payment verified notification:", notifErr);
    }
  }

  return NextResponse.json({ ok: true });
}
