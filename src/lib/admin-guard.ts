// helper ตรวจสิทธิ์แอดมินสำหรับ API admin
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// คืนค่า response 403 หากไม่ใช่ ADMIN
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false as const, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, user: session.user };
}
