// API สมัครสมาชิก (สร้างผู้ใช้ + ร้านถ้าเป็นเจ้าของร้าน)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  password: z.string().min(6),
  role: z.enum(["CUSTOMER", "SHOP_OWNER"]).default("CUSTOMER")
});

// POST: ลงทะเบียนผู้ใช้ใหม่
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const { name, email, phone, password, role } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return NextResponse.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      password: bcrypt.hashSync(password, 10),
      role,
      status: "ACTIVE"
    }
  });

  if (role === "SHOP_OWNER") {
    await prisma.shop.create({
      data: { ownerId: user.id, name: `ร้านของ ${name}`, status: "PENDING" }
    });
  }

  return NextResponse.json({ ok: true, id: user.id });
}
