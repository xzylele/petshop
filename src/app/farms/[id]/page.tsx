// หน้ารายละเอียดฟาร์ม + รายการสัตว์ในฟาร์ม
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AnimalCard from "@/components/AnimalCard";

export const dynamic = "force-dynamic";

// โหลดข้อมูลฟาร์มและสัตว์ที่เกี่ยวข้อง
export default async function FarmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const farm = await prisma.farm.findUnique({
    where: { id },
    include: { animals: true, images: { orderBy: { sortOrder: "asc" } } }
  });
  if (!farm) notFound();

  const types = farm.animalTypes.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="card overflow-hidden">
        <div className="aspect-[3/1] w-full bg-slate-100">
          {farm.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={farm.coverImageUrl} alt={farm.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">ไม่มีรูป</div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-800">🏡 {farm.name}</h1>
          <div className="mt-1 text-sm text-slate-500">{farm.province ?? "—"} {farm.district ? `· ${farm.district}` : ""}</div>
          {types.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {types.map((t) => <span key={t} className="badge bg-brand-100 text-brand-700">{t}</span>)}
            </div>
          )}
          <p className="mt-4 whitespace-pre-wrap text-slate-700">{farm.description ?? "—"}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-slate-500">ที่อยู่</dt>
              <dd className="font-medium">{farm.address}</dd>
            </div>
            <div>
              <dt className="text-slate-500">เบอร์โทร</dt>
              <dd className="font-medium">{farm.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ตำแหน่ง</dt>
              <dd className="font-medium">
                {farm.latitude && farm.longitude ? (
                  <a
                    className="text-brand-700 hover:underline"
                    href={`https://www.google.com/maps/search/?api=1&query=${farm.latitude},${farm.longitude}`}
                    target="_blank" rel="noreferrer"
                  >
                    เปิดแผนที่ →
                  </a>
                ) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold text-slate-800">สัตว์จากฟาร์มนี้</h2>
      {farm.animals.length === 0 ? (
        <div className="card p-6 text-center text-slate-500">ยังไม่มีสัตว์เปิดขาย</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {farm.animals.map((a) => (
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
              farmName={farm.name}
              status={a.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
