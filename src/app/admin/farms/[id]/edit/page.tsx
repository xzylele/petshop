// หน้าแก้ไขฟาร์ม (แอดมิน)
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FarmForm from "../../FarmForm";

export const dynamic = "force-dynamic";

// โหลดฟาร์มเพื่อเติมค่าเริ่มต้นในฟอร์ม
export default async function EditFarmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const farm = await prisma.farm.findUnique({ where: { id } });
  if (!farm) notFound();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">แก้ไขฟาร์ม</h1>
      <FarmForm initial={{
        id: farm.id,
        name: farm.name,
        description: farm.description ?? "",
        address: farm.address,
        province: farm.province ?? "",
        district: farm.district ?? "",
        subDistrict: farm.subDistrict ?? "",
        phone: farm.phone ?? "",
        latitude: farm.latitude ?? "",
        longitude: farm.longitude ?? "",
        coverImageUrl: farm.coverImageUrl ?? "",
        animalTypes: farm.animalTypes,
        status: farm.status
      }} />
    </div>
  );
}
