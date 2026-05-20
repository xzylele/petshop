// API ตะกร้า: ปรับจำนวน/ลบรายการในตะกร้า
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ตรวจว่ารายการตะกร้าเป็นของผู้ใช้จริง
async function ensureOwner(itemId: string, userId: string) {
  const it = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!it || it.cart.userId !== userId) return null;
  return it;
}

// PUT: ปรับจำนวนสินค้าในตะกร้า
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const it = await ensureOwner(id, session.user.id);
  if (!it) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { quantity } = await req.json().catch(() => ({ quantity: 1 }));
  const q = Math.max(1, Number(quantity) || 1);
  await prisma.cartItem.update({ where: { id }, data: { quantity: q } });
  return NextResponse.json({ ok: true });
}

// DELETE: ลบรายการจากตะกร้า
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const it = await ensureOwner(id, session.user.id);
  if (!it) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.cartItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
