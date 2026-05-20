// API ตะกร้า: เพิ่มสินค้า/สัตว์ลงตะกร้า
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  productId: z.string().optional(),
  animalId: z.string().optional(),
  quantity: z.number().int().positive().default(1)
});

// POST: เพิ่มรายการใหม่หรือเพิ่มจำนวนในตะกร้า
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { productId, animalId, quantity } = parsed.data;
  if (!productId && !animalId) return NextResponse.json({ error: "ต้องระบุสินค้าหรือสัตว์" }, { status: 400 });

  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id }
  });

  if (productId) {
    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
    }
  } else if (animalId) {
    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, animalId } });
    if (existing) return NextResponse.json({ error: "สัตว์ตัวนี้อยู่ในตะกร้าแล้ว" }, { status: 409 });
    await prisma.cartItem.create({ data: { cartId: cart.id, animalId, quantity: 1 } });
  }

  return NextResponse.json({ ok: true });
}
