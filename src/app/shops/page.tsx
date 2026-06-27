// หน้ารวมร้านค้า: แสดงเฉพาะร้านที่อนุมัติแล้ว
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ShopCard from "@/components/ShopCard";

export const dynamic = "force-dynamic";

// โหลดร้านค้าและจำนวนสินค้าทั้งหมดของร้าน พร้อมตัวกรองค้นหา
export default async function ShopsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; province?: string; service?: string }> 
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const province = sp.province || "";
  const service = sp.service || "";

  // ดึงรายการจังหวัดที่ไม่ซ้ำกันทั้งหมดจากร้านค้าที่อนุมัติแล้วมาทำเป็นตัวกรอง
  const allApprovedShops = await prisma.shop.findMany({
    where: { status: "APPROVED" },
    select: { province: true }
  });
  const provinces = Array.from(new Set(allApprovedShops.map(s => s.province).filter(Boolean))) as string[];

  // ตั้งเงื่อนไขการค้นหา
  const where: any = { status: "APPROVED" };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } }
    ];
  }
  if (province) {
    where.province = province;
  }
  if (service === "grooming") {
    where.allowsGrooming = true;
  } else if (service === "boarding") {
    where.allowsBoarding = true;
  }

  const shops = await prisma.shop.findMany({
    where,
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-800">ร้านค้าทั้งหมด</h1>
      <p className="mb-6 text-sm text-slate-600">ร้านค้าที่ผ่านการตรวจสอบในระบบ</p>

      {/* ฟอร์มการค้นหาและกรองร้านค้า */}
      <form className="card mb-6 grid gap-3 p-4 md:grid-cols-4">
        <input 
          name="q" 
          placeholder="ค้นหาชื่อร้านค้าหรือคำอธิบาย..." 
          defaultValue={q} 
          className="input md:col-span-2 text-sm" 
        />
        <select name="province" defaultValue={province} className="input text-sm">
          <option value="">ทุกจังหวัด</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="service" defaultValue={service} className="input text-sm">
          <option value="">บริการทั้งหมด</option>
          <option value="grooming">✂️ อาบน้ำตัดขน (Grooming)</option>
          <option value="boarding">🏨 รับฝากเลี้ยง (Pet Hotel)</option>
        </select>
        <div className="md:col-span-4 flex gap-2">
          <button type="submit" className="btn-primary py-2 px-4 text-sm font-semibold">ค้นหาร้านค้า</button>
          <Link href="/shops" className="btn-outline py-2 px-4 text-sm font-semibold text-center">ล้างตัวกรอง</Link>
        </div>
      </form>

      {shops.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          ไม่พบร้านค้าที่ตรงกับเงื่อนไขการค้นหา
        </div>
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
