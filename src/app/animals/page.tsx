// หน้ารวมสัตว์เลี้ยง: รองรับค้นหา/กรองประเภท
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AnimalCard from "@/components/AnimalCard";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ANIMAL_TYPES = ["สุนัข", "แมว", "นก", "ปลา", "กระต่าย", "สัตว์เลื้อยคลาน", "สัตว์แปลก"];

// โหลดสัตว์จาก Prisma ตามตัวกรอง
export default async function AnimalsPage({ searchParams }: { searchParams: Promise<{ type?: string; q?: string; exotic?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.AnimalWhereInput = { status: { in: ["ACTIVE", "RESERVED"] } };
  if (sp.type && sp.type !== "สัตว์แปลก") where.animalType = sp.type;
  if (sp.type === "สัตว์แปลก" || sp.exotic === "1") where.isExotic = true;
  if (sp.q) where.OR = [{ name: { contains: sp.q } }, { breed: { contains: sp.q } }];

  const animals = await prisma.animal.findMany({
    where,
    include: { farm: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-800">สัตว์เลี้ยงที่เปิดขาย</h1>
      <p className="mb-6 text-sm text-slate-600">ข้อมูลจากฟาร์มและผู้ขายที่ผ่านการตรวจสอบ</p>

      <form className="card mb-6 grid gap-3 p-4 md:grid-cols-3">
        <input name="q" placeholder="ค้นชื่อหรือสายพันธุ์..." defaultValue={sp.q ?? ""} className="input" />
        <select name="type" defaultValue={sp.type ?? ""} className="input">
          <option value="">ทุกประเภท</option>
          {ANIMAL_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">ค้นหา</button>
          <Link href="/animals" className="btn-outline">ล้าง</Link>
        </div>
      </form>

      {animals.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">ยังไม่มีสัตว์ในเงื่อนไขนี้</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
    </div>
  );
}
