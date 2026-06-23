// หน้ารวมสินค้า: รองรับค้นหา/กรองผ่าน query string
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORIES = ["อาหารสัตว์", "ขนมสัตว์", "ของเล่น", "กรงและบ้าน", "ที่นอน", "อุปกรณ์ให้อาหารและน้ำ", "อุปกรณ์อาบน้ำและดูแลขน", "ยาและวิตามิน"];
const PET_TYPES = ["สุนัข", "แมว", "นก", "ปลา", "กระต่าย", "สัตว์เลื้อยคลาน"];

// โหลดสินค้าจาก Prisma ตามตัวกรอง
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string; petType?: string; q?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.ProductWhereInput = { 
    status: "ACTIVE",
    shop: { status: "APPROVED" }
  };
  if (sp.category) where.category = sp.category;
  if (sp.petType) where.petType = sp.petType;
  if (sp.q) where.name = { contains: sp.q };

  const products = await prisma.product.findMany({
    where,
    include: { shop: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">สินค้าสำหรับสัตว์เลี้ยง</h1>

      <form className="card mb-6 grid gap-3 p-4 md:grid-cols-4">
        <input name="q" placeholder="ค้นหาสินค้า..." defaultValue={sp.q ?? ""} className="input md:col-span-2" />
        <select name="category" defaultValue={sp.category ?? ""} className="input">
          <option value="">ทุกหมวดหมู่</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="petType" defaultValue={sp.petType ?? ""} className="input">
          <option value="">ทุกประเภทสัตว์</option>
          {PET_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="md:col-span-4 flex gap-2">
          <button type="submit" className="btn-primary">ค้นหา</button>
          <Link href="/products" className="btn-outline">ล้างตัวกรอง</Link>
        </div>
      </form>

      {products.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">ไม่พบสินค้าที่ตรงกับเงื่อนไข</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
    </div>
  );
}
