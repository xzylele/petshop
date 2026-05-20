// หน้าเพิ่มสัตว์ใหม่ (แอดมิน)
import { prisma } from "@/lib/prisma";
import AnimalForm from "../AnimalForm";

export const dynamic = "force-dynamic";

// โหลดรายชื่อฟาร์มเพื่อเลือกในฟอร์ม
export default async function NewAnimalPage() {
  const farms = await prisma.farm.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">เพิ่มสัตว์</h1>
      <AnimalForm farms={farms} />
    </div>
  );
}
