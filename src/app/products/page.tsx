// หน้ารวมสินค้า: รองรับค้นหา/กรองผ่าน query string และการแบ่งหมวดหมู่แบบใหม่
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import type { Prisma } from "@/generated/client";
import ProductFilters from "./ProductFilters";

export const dynamic = "force-dynamic";

// โหลดสินค้าจาก Prisma ตามตัวกรอง
export default async function ProductsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    category?: string; 
    petType?: string; 
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }> 
}) {
  const sp = await searchParams;
  const where: Prisma.ProductWhereInput = { 
    status: "ACTIVE",
    shop: { status: "APPROVED" }
  };
  
  if (sp.category) where.category = sp.category;
  if (sp.petType) where.petType = sp.petType;
  if (sp.q) where.name = { contains: sp.q };
  
  // เพิ่มการกรองช่วงราคา
  if (sp.minPrice || sp.maxPrice) {
    where.price = {
      gte: sp.minPrice ? parseFloat(sp.minPrice) : undefined,
      lte: sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
    };
  }

  // กำหนดการจัดเรียงลำดับ
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sp.sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (sp.sort === "price_desc") {
    orderBy = { price: "desc" };
  } else if (sp.sort === "name_asc") {
    orderBy = { name: "asc" };
  }

  const products = await prisma.product.findMany({
    where,
    include: { shop: { select: { name: true } } },
    orderBy
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* ส่วนหัวของหน้า */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">สินค้าสำหรับสัตว์เลี้ยง</h1>
        <p className="text-slate-500 mt-1">ช้อปสินค้าคุณภาพสูงสำหรับสัตว์เลี้ยงที่คุณรักจากร้านค้าที่น่าเชื่อถือ</p>
      </div>

      <ProductFilters>
        {/* จำนวนผลลัพธ์การค้นหา */}
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>พบสินค้าทั้งหมด {products.length} รายการ</span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">📦</div>
            <h2 className="text-base font-bold text-slate-800">ไม่พบสินค้า</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              ขออภัย ไม่พบสินค้าที่ตรงตามตัวเลือกของคุณในขณะนี้ กรุณาลองปรับลดเงื่อนไขการกรองหรือค้นหาคำสำคัญใหม่อีกครั้ง
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                category={p.category}
                petType={p.petType}
                price={p.price}
                imageUrl={p.imageUrl}
                shopName={p.shop?.name}
                stock={p.stock}
              />
            ))}
          </div>
        )}
      </ProductFilters>
    </div>
  );
}

