// หน้ารวมสัตว์เลี้ยง: รองรับค้นหา/กรองประเภทแบบใหม่และการจัดเรียง
import { prisma } from "@/lib/prisma";
import AnimalCard from "@/components/AnimalCard";
import type { Prisma } from "@/generated/client";
import AnimalFilters from "./AnimalFilters";

export const dynamic = "force-dynamic";

// โหลดสัตว์จาก Prisma ตามตัวกรอง
export default async function AnimalsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    type?: string; 
    gender?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    exotic?: string;
    sort?: string;
    q?: string; 
  }> 
}) {
  const sp = await searchParams;
  
  // กำหนดสถานะตามฟิลเตอร์ หากไม่ระบุจะดีฟอลต์ที่ ACTIVE เพื่อไม่ให้สัตว์ที่ขายไปแล้วปะปน
  const statusFilter = sp.status || "ACTIVE";
  
  const where: Prisma.AnimalWhereInput = {
    status: statusFilter,
    AND: [
      {
        OR: [
          { farmId: null },
          { farm: { status: "ACTIVE" } }
        ]
      }
    ]
  };

  if (sp.type) where.animalType = sp.type;
  if (sp.gender) where.gender = sp.gender;
  if (sp.exotic === "1") where.isExotic = true;
  
  if (sp.minPrice || sp.maxPrice) {
    where.price = {
      gte: sp.minPrice ? parseFloat(sp.minPrice) : undefined,
      lte: sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
    };
  }

  if (sp.q) {
    where.AND = [
      ...(where.AND as any[]),
      {
        OR: [
          { name: { contains: sp.q } },
          { breed: { contains: sp.q } }
        ]
      }
    ];
  }

  // ตัวเลือกจัดเรียงลำดับ
  let orderBy: Prisma.AnimalOrderByWithRelationInput = { createdAt: "desc" };
  if (sp.sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (sp.sort === "price_desc") {
    orderBy = { price: "desc" };
  } else if (sp.sort === "age_asc") {
    // อายุน้อยไปมาก = วันเกิดล่าสุดลงไป (Desc)
    orderBy = { birthDate: "desc" };
  } else if (sp.sort === "age_desc") {
    // อายุมากไปน้อย = วันเกิดเก่าสุดขึ้นมา (Asc)
    orderBy = { birthDate: "asc" };
  }

  const animals = await prisma.animal.findMany({
    where,
    include: { farm: { select: { name: true } } },
    orderBy
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">สัตว์เลี้ยงที่เปิดขาย</h1>
        <p className="text-slate-500 mt-1">ค้นหาสัตว์เลี้ยงน่ารักตรงสายพันธุ์จากฟาร์มที่ขึ้นทะเบียนรับรองความปลอดภัย</p>
      </div>

      <AnimalFilters>
        {/* จำนวนผลลัพธ์ */}
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>พบสัตว์เลี้ยงทั้งหมด {animals.length} ตัว</span>
        </div>

        {animals.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">🐶</div>
            <h2 className="text-base font-bold text-slate-800">ไม่พบสัตว์เลี้ยง</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              ขออภัย ไม่พบสัตว์เลี้ยงที่ตรงตามตัวเลือกของคุณในขณะนี้ กรุณาลองปรับลดเงื่อนไขการกรองหรือค้นหาใหม่อีกครั้ง
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {animals.map((a) => (
              <AnimalCard
                key={a.id}
                id={a.id}
                name={a.name}
                animalType={a.animalType}
                breed={a.breed}
                gender={a.gender}
                price={a.price}
                imageUrl={a.imageUrl}
                isExotic={a.isExotic}
                farmName={a.farm?.name ?? null}
                status={a.status}
              />
            ))}
          </div>
        )}
      </AnimalFilters>
    </div>
  );
}

