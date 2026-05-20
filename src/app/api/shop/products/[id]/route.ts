// API ร้านค้า: แก้ไข/ลบสินค้า
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  category: z.string().min(1),
  petType: z.string().optional().default(""),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  imageUrl: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "HIDDEN", "OUT_OF_STOCK"]).default("ACTIVE")
});

// ตรวจว่าสินค้าเป็นของร้านผู้ใช้ (หรือเป็นแอดมิน)
async function ensureOwn(id: string, userId: string, isAdmin: boolean) {
  const product = await prisma.product.findUnique({ where: { id }, include: { shop: true } });
  if (!product) return null;
  if (!isAdmin && product.shop.ownerId !== userId) return null;
  return product;
}

// PUT: แก้ไขข้อมูลสินค้า
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await ensureOwn(id, session.user.id, session.user.role === "ADMIN");
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await prisma.product.update({
    where: { id },
    data: { ...parsed.data, petType: parsed.data.petType || null, imageUrl: parsed.data.imageUrl || null, description: parsed.data.description || null }
  });
  return NextResponse.json({ ok: true });
}

// DELETE: ลบสินค้าออกจากร้าน
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await ensureOwn(id, session.user.id, session.user.role === "ADMIN");
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
