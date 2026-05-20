// หน้าแก้ไขสัตว์ (แอดมิน)
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AnimalForm from "../../AnimalForm";

export const dynamic = "force-dynamic";

// โหลดสัตว์และฟาร์มเพื่อเติมค่าเริ่มต้น
export default async function EditAnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [animal, farms] = await Promise.all([
    prisma.animal.findUnique({ where: { id } }),
    prisma.farm.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);
  if (!animal) notFound();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">แก้ไขข้อมูลสัตว์</h1>
      <AnimalForm
        farms={farms}
        initial={{
          id: animal.id,
          name: animal.name ?? "",
          animalType: animal.animalType,
          breed: animal.breed ?? "",
          gender: animal.gender ?? "",
          price: animal.price,
          description: animal.description ?? "",
          imageUrl: animal.imageUrl ?? "",
          isExotic: animal.isExotic,
          farmId: animal.farmId ?? "",
          status: animal.status
        }}
      />
    </div>
  );
}
