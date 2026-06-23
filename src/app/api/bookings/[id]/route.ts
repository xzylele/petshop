import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rawData = await req.json().catch(() => null);
    const parsed = UpdateStatusSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    const { status } = parsed.data;

    // ค้นหารายการจอง
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { shop: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบรายการจองนี้" }, { status: 404 });
    }

    const isCustomer = booking.userId === session.user.id;
    const isShopOwner = booking.shop.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isCustomer && !isShopOwner && !isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // กรณีที่ลูกค้าขอยกเลิก
    if (isCustomer && !isShopOwner && !isAdmin) {
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอในการเปลี่ยนเป็นสถานะนี้" }, { status: 403 });
      }
      if (booking.status !== "PENDING") {
        return NextResponse.json({ error: "สามารถยกเลิกการจองได้เฉพาะช่วงที่รอการยืนยันเท่านั้น" }, { status: 400 });
      }
    }

    // ทำการอัปเดตสถานะ
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ ok: true, booking: updatedBooking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
