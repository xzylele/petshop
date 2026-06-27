import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true }
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อนี้" }, { status: 404 });
    }

    // มีสิทธิ์ยกเลิกเฉพาะเจ้าของออเดอร์ หรือแอดมิน
    if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้" }, { status: 403 });
    }

    // ยกเลิกได้เฉพาะสถานะ PENDING_PAYMENT และ PAID
    const CANCELABLE_STATUSES = ["PENDING_PAYMENT", "PAID"];
    if (!CANCELABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: "ไม่สามารถยกเลิกคำสั่งซื้อได้ในสถานะนี้ (ผู้ขายอาจจัดส่งสินค้าแล้ว)" },
        { status: 400 }
      );
    }

    // ประมวลผลยกเลิกด้วยทรานแซกชันเพื่อความถูกต้องของสต็อกสินค้า
    await prisma.$transaction(async (tx) => {
      // 1. อัปเดตสถานะออเดอร์เป็น CANCELLED
      await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" }
      });

      // 2. อัปเดตสถานะการชำระเงินเป็น REJECTED (ถ้ามี)
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "REJECTED" }
        });
      }

      // 3. บวกสต็อกสินค้าคืน และแก้สถานะสัตว์เลี้ยงเป็น ACTIVE
      for (const item of order.items) {
        if (item.productId) {
          // คืนสต็อกสินค้า
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        } else if (item.animalId) {
          // คืนสถานะสัตว์เลี้ยงให้พร้อมขาย
          await tx.animal.update({
            where: { id: item.animalId },
            data: { status: "ACTIVE" }
          });
        }
      }
    });

    return NextResponse.json({ ok: true, message: "ยกเลิกคำสั่งซื้อและคืนสินค้าเข้าคลังเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ" }, { status: 500 });
  }
}
