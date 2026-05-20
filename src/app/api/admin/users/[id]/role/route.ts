// API แอดมิน: เปลี่ยนบทบาทผู้ใช้
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const Body = z.object({ role: z.enum(["CUSTOMER", "SHOP_OWNER", "SHOP_STAFF", "ADMIN"]) });

// PUT: เปลี่ยน role ของผู้ใช้ตาม id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid role" }, { status: 400 });
  await prisma.user.update({ where: { id }, data: { role: parsed.data.role } });
  return NextResponse.json({ ok: true });
}
