// API แอดมิน: สร้างฟาร์มใหม่
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  address: z.string().min(1),
  province: z.string().optional().default(""),
  district: z.string().optional().default(""),
  subDistrict: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  latitude: z.union([z.number(), z.literal("")]).optional(),
  longitude: z.union([z.number(), z.literal("")]).optional(),
  coverImageUrl: z.string().optional().default(""),
  animalTypes: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "HIDDEN", "PENDING"]).default("ACTIVE")
});

// POST: เพิ่มฟาร์มลงฐานข้อมูล
export async function POST(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;

  const created = await prisma.farm.create({
    data: {
      name: d.name,
      description: d.description || null,
      address: d.address,
      province: d.province || null,
      district: d.district || null,
      subDistrict: d.subDistrict || null,
      phone: d.phone || null,
      latitude: d.latitude === "" || d.latitude === undefined ? null : Number(d.latitude),
      longitude: d.longitude === "" || d.longitude === undefined ? null : Number(d.longitude),
      coverImageUrl: d.coverImageUrl || null,
      animalTypes: d.animalTypes,
      status: d.status
    }
  });
  return NextResponse.json({ ok: true, id: created.id });
}
