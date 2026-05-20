// API คำสั่งซื้อ: สร้างออเดอร์จากตะกร้า
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  address: z.string().min(5),
  note: z.string().optional().default(""),
  method: z.enum(["QR_CODE", "BANK_TRANSFER"])
});

// POST: สร้างคำสั่งซื้อ + สร้าง payment + หักสต็อก
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true, animal: true } } }
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "ตะกร้าว่าง" }, { status: 400 });
  }

  let total = 0;
  const orderItems: { productId?: string; animalId?: string; name: string; quantity: number; price: number }[] = [];
  for (const it of cart.items) {
    if (it.product) {
      if (it.product.stock < it.quantity) {
        return NextResponse.json({ error: `สินค้า ${it.product.name} ไม่พอ` }, { status: 400 });
      }
      total += it.product.price * it.quantity;
      orderItems.push({ productId: it.productId!, name: it.product.name, quantity: it.quantity, price: it.product.price });
    } else if (it.animal) {
      if (it.animal.status !== "ACTIVE") {
        return NextResponse.json({ error: `สัตว์ ${it.animal.name ?? it.animal.animalType} ไม่พร้อมขาย` }, { status: 400 });
      }
      total += it.animal.price;
      orderItems.push({ animalId: it.animalId!, name: it.animal.name ?? it.animal.animalType, quantity: 1, price: it.animal.price });
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: session.user.id,
        total,
        address: parsed.data.address,
        note: parsed.data.note,
        status: "PENDING_PAYMENT",
        items: { create: orderItems },
        payment: { create: { method: parsed.data.method, amount: total, status: "PENDING" } }
      }
    });

    for (const it of cart.items) {
      if (it.product) {
        await tx.product.update({ where: { id: it.productId! }, data: { stock: { decrement: it.quantity } } });
      } else if (it.animal) {
        await tx.animal.update({ where: { id: it.animalId! }, data: { status: "RESERVED" } });
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return NextResponse.json({ ok: true, id: order.id });
}
