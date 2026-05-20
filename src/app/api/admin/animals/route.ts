// API แอดมิน: เพิ่มสัตว์ใหม่
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const Body = z.object({
  name: z.string().optional().default(""),
  animalType: z.string().min(1),
  breed: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  price: z.number().min(0),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  isExotic: z.boolean().default(false),
  farmId: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "HIDDEN", "SOLD", "RESERVED"]).default("ACTIVE")
});

// POST: เพิ่มสัตว์ลงฐานข้อมูล
export async function POST(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;

  const created = await prisma.animal.create({
    data: {
      name: d.name || null,
      animalType: d.animalType,
      breed: d.breed || null,
      gender: d.gender || null,
      price: d.price,
      description: d.description || null,
      imageUrl: d.imageUrl || null,
      isExotic: d.isExotic,
      farmId: d.farmId || null,
      status: d.status
    }
  });
  return NextResponse.json({ ok: true, id: created.id });
}
