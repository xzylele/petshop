import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  dateTime: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  checkOutDateTime: z.string().nullable().optional().transform((val) => (val ? new Date(val) : null)),
  petName: z.string().optional(),
  petType: z.string().optional(),
  petWeight: z.number().nullable().optional(),
  price: z.number().optional(),
  notes: z.string().nullable().optional(),
  days: z.number().int().nullable().optional()
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
    const parsed = UpdateBookingSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
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
      const keys = Object.keys(rawData || {});
      const hasOtherKeys = keys.some((k) => k !== "status");
      if (status !== "CANCELLED" || hasOtherKeys) {
        return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอในการแก้ไขข้อมูลส่วนนี้" }, { status: 403 });
      }
      if (booking.status !== "PENDING") {
        return NextResponse.json({ error: "สามารถยกเลิกการจองได้เฉพาะช่วงที่รอการยืนยันเท่านั้น" }, { status: 400 });
      }
    }

    // เตรียมอัปเดตข้อมูล
    const updateData: any = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.dateTime !== undefined) updateData.dateTime = parsed.data.dateTime;
    if (parsed.data.checkOutDateTime !== undefined) updateData.checkOutDateTime = parsed.data.checkOutDateTime;
    if (parsed.data.petName !== undefined) updateData.petName = parsed.data.petName;
    if (parsed.data.petType !== undefined) updateData.petType = parsed.data.petType;
    if (parsed.data.petWeight !== undefined) updateData.petWeight = parsed.data.petWeight;
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    if (parsed.data.days !== undefined) updateData.days = parsed.data.days;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ ok: true, booking: updatedBooking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
