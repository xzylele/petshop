// API ร้านค้า: เพิ่มสินค้าใหม่
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

// POST: เพิ่มสินค้าในร้านของผู้ใช้
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SHOP_OWNER" && session.user.role !== "SHOP_STAFF" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const shop = await prisma.shop.findUnique({ where: { ownerId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "ต้องสร้างร้านค้าก่อน" }, { status: 400 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const created = await prisma.product.create({
    data: { ...parsed.data, shopId: shop.id, petType: parsed.data.petType || null, imageUrl: parsed.data.imageUrl || null, description: parsed.data.description || null }
  });
  return NextResponse.json({ ok: true, id: created.id });
}
