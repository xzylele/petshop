import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateBannerSchema = z.object({
  title: z.string().optional().default(""),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional().nullable(),
  order: z.number().int().optional()
});

// PUT: แก้ไขข้อมูลแบนเนอร์ (เฉพาะแอดมิน)
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
    const parsed = UpdateBannerSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: "ไม่พบแบนเนอร์นี้ในระบบ" }, { status: 404 });
    }

    const updated = await prisma.banner.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ ok: true, banner: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: ลบแบนเนอร์ (เฉพาะแอดมิน)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: "ไม่พบแบนเนอร์นี้ในระบบ" }, { status: 404 });
    }

    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
