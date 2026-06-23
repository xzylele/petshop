import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: อัปเดตสต็อกสินค้าอย่างรวดเร็ว (ตรวจสิทธิ์เจ้าของร้านก่อน)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  // โหลดสินค้าและดึงเจ้าของร้านค้ามาเช็คสิทธิ์
  const product = await prisma.product.findUnique({
    where: { id },
    include: { shop: true }
  });

  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }

  // แอดมิน หรือ เจ้าของร้านนี้เท่านั้นที่ทำได้
  if (session.user.role !== "ADMIN" && product.shop.ownerId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const stock = body.stock;

  if (typeof stock !== "number" || stock < 0) {
    return NextResponse.json({ error: "จำนวนสต็อกไม่ถูกต้อง" }, { status: 400 });
  }

  // ออโต้อัปเดตสถานะ: ถ้าสต็อกเป็น 0 ให้เป็น OUT_OF_STOCK
  // ถ้าสต็อกเพิ่มกลับมากกว่า 0 และสถานะเดิมคือ OUT_OF_STOCK ให้เปลี่ยนกลับเป็น ACTIVE
  let nextStatus = product.status;
  if (stock === 0) {
    nextStatus = "OUT_OF_STOCK";
  } else if (stock > 0 && product.status === "OUT_OF_STOCK") {
    nextStatus = "ACTIVE";
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      stock,
      status: nextStatus
    }
  });

  return NextResponse.json({ 
    ok: true, 
    stock: updatedProduct.stock, 
    status: updatedProduct.status 
  });
}
