import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: ดึงสถานะออร์เดอร์และเลขพัสดุแบบย่อ (สำหรับ Polling เรียลไทม์)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      trackingNumber: true,
      payment: {
        select: {
          status: true
        }
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
