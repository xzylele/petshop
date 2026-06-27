import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ShopUpdateSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อร้านค้า"),
  description: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  province: z.string().optional().default(""),
  coverUrl: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  allowsGrooming: z.boolean().optional().default(false),
  allowsBoarding: z.boolean().optional().default(false),
  boardingCapacity: z.number().int().nonnegative().optional().default(5),
  boardingPrice: z.number().nonnegative().optional().default(500),
  groomingPriceSmall: z.number().nonnegative().optional().default(350),
  groomingPriceMedium: z.number().nonnegative().optional().default(500),
  groomingPriceLarge: z.number().nonnegative().optional().default(650),
  spaPriceSmall: z.number().nonnegative().optional().default(450),
  spaPriceMedium: z.number().nonnegative().optional().default(600),
  spaPriceLarge: z.number().nonnegative().optional().default(750)
});

// GET: ดึงข้อมูลร้านค้าตาม ID (เฉพาะแอดมิน)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop) {
      return NextResponse.json({ error: "ไม่พบร้านค้านี้" }, { status: 404 });
    }

    return NextResponse.json({ shop });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: อัปเดตข้อมูลร้านค้าของใครก็ได้ (เฉพาะแอดมิน)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const rawData = await req.json().catch(() => null);
    const parsed = ShopUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return NextResponse.json({ error: "ไม่พบร้านค้านี้ในระบบ" }, { status: 404 });
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ ok: true, shop: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
