// API ร้านค้า: เปลี่ยนสถานะคำสั่งซื้อ
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  status: z.enum(["PAID", "PREPARING", "SHIPPED", "COMPLETED", "CANCELLED"]),
  trackingNumber: z.string().optional().nullable()
});

// PUT: อัปเดตสถานะคำสั่งซื้อ (ตรวจสิทธิ์ร้านก่อน)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "SHOP_OWNER" && session.user.role !== "SHOP_STAFF" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid status" }, { status: 400 });

  if (session.user.role !== "ADMIN") {
    const shop = await prisma.shop.findUnique({ where: { ownerId: session.user.id } });
    if (!shop) return NextResponse.json({ error: "no shop" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { shopId: true } } } } }
    });
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
    const hasMyItem = order.items.some((i) => i.product?.shopId === shop.id);
    if (!hasMyItem) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const newStatus = parsed.data.status;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (newStatus === "CANCELLED") {
    if (!order.pointsRefunded) {
      await prisma.$transaction(async (tx) => {
        // คืนแต้มที่ผู้ใช้จ่ายไป
        if (order.pointsUsed > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { points: { increment: order.pointsUsed } }
          });
        }
        // ยึดแต้มคืนหากชำระเงินและบวกแต้มไปแล้ว
        if (order.pointsCredited && order.pointsEarned > 0) {
          const u = await tx.user.findUnique({ where: { id: order.userId } });
          const currentPoints = u ? u.points : 0;
          await tx.user.update({
            where: { id: order.userId },
            data: { points: Math.max(0, currentPoints - order.pointsEarned) }
          });
        }
        // อัปเดตสถานะออเดอร์
        await tx.order.update({
          where: { id },
          data: {
            status: "CANCELLED",
            pointsRefunded: true,
            pointsCredited: false,
            trackingNumber: parsed.data.trackingNumber !== undefined ? parsed.data.trackingNumber : undefined
          }
        });
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          trackingNumber: parsed.data.trackingNumber !== undefined ? parsed.data.trackingNumber : undefined
        }
      });
    }
  } else {
    // สถานะอื่น ๆ (PAID, PREPARING, SHIPPED, COMPLETED)
    const shouldCreditPoints = ["PAID", "PREPARING", "SHIPPED", "COMPLETED"].includes(newStatus);
    if (shouldCreditPoints && !order.pointsCredited) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: order.userId },
          data: { points: { increment: order.pointsEarned } }
        }),
        prisma.order.update({
          where: { id },
          data: {
            status: newStatus,
            pointsCredited: true,
            trackingNumber: parsed.data.trackingNumber !== undefined ? parsed.data.trackingNumber : undefined
          }
        })
      ]);
    } else {
      await prisma.order.update({
        where: { id },
        data: {
          status: newStatus,
          trackingNumber: parsed.data.trackingNumber !== undefined ? parsed.data.trackingNumber : undefined
        }
      });
    }
  }

  return NextResponse.json({ ok: true });
}
