// หน้ารวมฟาร์ม: ค้นหาและแสดงรายการฟาร์มแบบใหม่แบ่งตามหมวดหมู่
import { prisma } from "@/lib/prisma";
import FarmCard from "@/components/FarmCard";
import type { Prisma } from "@/generated/client";
import FarmFilters from "./FarmFilters";

export const dynamic = "force-dynamic";

// โหลดฟาร์มที่ ACTIVE ตามตัวกรอง
export default async function FarmsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    province?: string; 
    q?: string;
    animalType?: string;
    sort?: string;
  }> 
}) {
  const sp = await searchParams;
  
  // ดึงรายการจังหวัดที่ไม่ซ้ำกันทั้งหมดจากฟาร์มที่ใช้งานอยู่มาทำเป็นตัวกรอง
  const allActiveFarms = await prisma.farm.findMany({
    where: { status: "ACTIVE" },
    select: { province: true }
  });
  const provinces = Array.from(new Set(allActiveFarms.map(f => f.province).filter(Boolean))) as string[];

  // ค้นหาตัวกรอง
  const where: Prisma.FarmWhereInput = {
    status: "ACTIVE"
  };

  if (sp.province) {
    where.province = sp.province;
  }
  
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q } },
      { address: { contains: sp.q } },
      { description: { contains: sp.q } }
    ];
  }

  // ตัวกรองสัตว์ที่เพาะพันธุ์ในฟาร์ม
  if (sp.animalType) {
    where.animalTypes = { contains: sp.animalType };
  }

  // ตัวเลือกจัดเรียงลำดับ
  let orderBy: Prisma.FarmOrderByWithRelationInput = { createdAt: "desc" };
  if (sp.sort === "name_asc") {
    orderBy = { name: "asc" };
  } else if (sp.sort === "name_desc") {
    orderBy = { name: "desc" };
  }

  const farms = await prisma.farm.findMany({
    where,
    orderBy
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ฟาร์มเพาะพันธุ์</h1>
        <p className="text-slate-500 mt-1">ฟาร์มเพาะพันธุ์สัตว์ที่ขึ้นทะเบียนอย่างเป็นทางการและผ่านการรับรองมาตรฐาน</p>
      </div>

      <FarmFilters provinces={provinces}>
        {/* จำนวนผลลัพธ์ */}
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>พบฟาร์มทั้งหมด {farms.length} แห่ง</span>
        </div>

        {farms.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">🏡</div>
            <h2 className="text-base font-bold text-slate-800">ไม่พบฟาร์มเพาะพันธุ์</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              ขออภัย ไม่พบฟาร์มเพาะพันธุ์ที่ตรงกับเงื่อนไขการกรองของคุณในขณะนี้ กรุณาเปลี่ยนตัวเลือกคัดกรองหรือล้างตัวกรองเพื่อเริ่มใหม่
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((f) => (
              <FarmCard
                key={f.id}
                id={f.id}
                name={f.name}
                province={f.province}
                description={f.description}
                coverImageUrl={f.coverImageUrl}
                animalTypes={f.animalTypes}
              />
            ))}
          </div>
        )}
      </FarmFilters>
    </div>
  );
}

