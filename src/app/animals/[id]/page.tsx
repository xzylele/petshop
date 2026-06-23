// หน้ารายละเอียดสัตว์เลี้ยง
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

// โหลดสัตว์จาก Prisma แล้วแสดงรายละเอียด
export default async function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const animal = await prisma.animal.findUnique({
    where: { id },
    include: { farm: true }
  });
  if (!animal || (animal.farm && animal.farm.status !== "ACTIVE")) notFound();

  const available = animal.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="aspect-square w-full bg-slate-100">
            {animal.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={animal.imageUrl} alt={animal.name ?? animal.animalType} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">ไม่มีรูป</div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>{animal.animalType}</span>
            {animal.breed && <span>· {animal.breed}</span>}
            {animal.isExotic && <span className="badge bg-amber-100 text-amber-800">สัตว์แปลก</span>}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{animal.name ?? "—"}</h1>
          <div className="mt-3 text-3xl font-bold text-brand-700">{formatTHB(animal.price)}</div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">เพศ</dt>
              <dd className="font-medium">{animal.gender ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">วันเกิด</dt>
              <dd className="font-medium">{animal.birthDate ? new Date(animal.birthDate).toLocaleDateString("th-TH") : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">สถานะ</dt>
              <dd className="font-medium">{animal.status}</dd>
            </div>
          </dl>

          <p className="mt-4 whitespace-pre-wrap text-slate-700">{animal.description ?? "—"}</p>

          {animal.farm && (
            <div className="card mt-4 p-4">
              <div className="text-xs text-slate-500">เพาะพันธุ์จาก</div>
              <Link href={`/farms/${animal.farm.id}`} className="text-brand-700 hover:underline">
                🏡 {animal.farm.name}
              </Link>
              {animal.farm.province && <div className="text-xs text-slate-500">{animal.farm.province}</div>}
            </div>
          )}

          <div className="card mt-4 bg-amber-50 p-3 text-xs text-amber-800">
            ⚠️ การซื้อขายสัตว์ควรตรวจสอบเอกสาร ใบรับรองสุขภาพ และสายพันธุ์อย่างรอบคอบก่อนตัดสินใจ
          </div>

          <div className="mt-6">
            <AddToCartButton animalId={animal.id} disabled={!available} label={available ? "จองสัตว์ตัวนี้" : "ไม่พร้อมขาย"} />
          </div>
        </div>
      </div>
    </div>
  );
}
