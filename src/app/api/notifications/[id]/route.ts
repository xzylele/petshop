import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: ทำเครื่องหมายอ่านแล้วเฉพาะอัน
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return NextResponse.json({ ok: true, notification: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: ลบการแจ้งเตือน
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
