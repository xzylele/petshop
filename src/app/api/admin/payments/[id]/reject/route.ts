// API แอดมิน: ปฏิเสธการชำระเงิน
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// PUT: เปลี่ยนสถานะการชำระเงินเป็น REJECTED
export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  
  const payment = await prisma.payment.update({ 
    where: { id }, 
    data: { status: "REJECTED" },
    include: { order: true }
  });

  // ส่งแจ้งเตือนเมื่อระบบปฏิเสธการชำระเงิน
  if (payment.order) {
    try {
      await prisma.notification.create({
        data: {
          userId: payment.order.userId,
          title: "⚠️ การชำระเงินไม่ถูกต้อง",
          message: `การชำระเงินของออเดอร์ #${payment.orderId.slice(-8)} ถูกปฏิเสธเนื่องจากความผิดพลาดของสลิป กรุณาตรวจสอบและอัปโหลดสลิปใหม่อีกครั้ง`,
          linkUrl: `/orders/${payment.orderId}`
        }
      });
    } catch (notifErr) {
      console.error("Error creating payment rejected notification:", notifErr);
    }
  }

  return NextResponse.json({ ok: true });
}
