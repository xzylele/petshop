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

  await prisma.order.update({ 
    where: { id }, 
    data: { 
      status: parsed.data.status,
      trackingNumber: parsed.data.trackingNumber !== undefined ? parsed.data.trackingNumber : undefined
    } 
  });
  return NextResponse.json({ ok: true });
}
