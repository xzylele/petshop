import { NextResponse } from "next/server";
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

    // แปลงไฟล์เป็น Base64 Data URL เพื่อแก้ปัญหา Read-only filesystem บน Serverless (เช่น Vercel)
    // และให้รูปภาพบันทึกลงฐานข้อมูลโดยตรง ทำให้รูปไม่หายเมื่อเซิร์ฟเวอร์รีสตาร์ท
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const fileUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ ok: true, url: fileUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
