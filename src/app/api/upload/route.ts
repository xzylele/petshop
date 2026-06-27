import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ป้องกันชื่อไฟล์ซ้ำและรองรับภาษาไทยในชื่อไฟล์โดยการใช้ Timestamp
    const ext = path.extname(file.name) || ".jpg";
    const filename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    const publicDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(publicDir, { recursive: true });

    const filePath = path.join(publicDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ ok: true, url: fileUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
