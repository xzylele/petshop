// หน้าแก้ไขสินค้า (หลังบ้านร้านค้า)
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductForm from "../../ProductForm";

export const dynamic = "force-dynamic";

// โหลดสินค้าและตรวจสิทธิ์เจ้าของร้าน
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const shop = await prisma.shop.findUnique({ where: { ownerId: session!.user.id } });
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();
  if (session!.user.role !== "ADMIN" && product.shopId !== shop?.id) notFound();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">แก้ไขสินค้า</h1>
      <ProductForm initial={{
        id: product.id,
        name: product.name,
        description: product.description ?? "",
        category: product.category,
        petType: product.petType ?? "",
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl ?? "",
        status: product.status
      }} />
    </div>
  );
}
