// หน้ารวมฟาร์ม: ค้นหาและแสดงรายการฟาร์ม
import { prisma } from "@/lib/prisma";
import FarmCard from "@/components/FarmCard";

export const dynamic = "force-dynamic";

// โหลดฟาร์มที่ ACTIVE ตามตัวกรอง
export default async function FarmsPage({ searchParams }: { searchParams: Promise<{ province?: string; q?: string }> }) {
  const sp = await searchParams;
  const farms = await prisma.farm.findMany({
    where: {
      status: "ACTIVE",
      ...(sp.province ? { province: sp.province } : {}),
      ...(sp.q ? { name: { contains: sp.q } } : {})
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-800">ฟาร์มเพาะพันธุ์</h1>
      <p className="mb-6 text-sm text-slate-600">ฟาร์มที่ผ่านการตรวจสอบและขึ้นทะเบียนในระบบ</p>

      <form className="card mb-6 grid gap-3 p-4 md:grid-cols-3">
        <input name="q" placeholder="ค้นชื่อฟาร์ม..." defaultValue={sp.q ?? ""} className="input md:col-span-2" />
        <button type="submit" className="btn-primary">ค้นหา</button>
      </form>

      {farms.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">ยังไม่มีฟาร์มในระบบ</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
    </div>
  );
}
