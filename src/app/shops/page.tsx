// หน้ารวมร้านค้า: แสดงเฉพาะร้านที่อนุมัติแล้ว
import { prisma } from "@/lib/prisma";
import ShopCard from "@/components/ShopCard";

export const dynamic = "force-dynamic";

// โหลดร้านค้าและจำนวนสินค้าทั้งหมดของร้าน
export default async function ShopsPage() {
  const shops = await prisma.shop.findMany({
    where: { status: "APPROVED" },
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-800">ร้านค้าทั้งหมด</h1>
      <p className="mb-6 text-sm text-slate-600">ร้านค้าที่ผ่านการตรวจสอบในระบบ</p>

      {shops.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">ยังไม่มีร้านค้า</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {shops.map((s) => (
            <ShopCard
              key={s.id}
              id={s.id}
              name={s.name}
              province={s.province}
              description={s.description}
              coverUrl={s.coverUrl}
              status={s.status}
              productCount={s._count.products}
              allowsGrooming={s.allowsGrooming}
              allowsBoarding={s.allowsBoarding}
            />
          ))}
        </div>
      )}
    </div>
  );
}
