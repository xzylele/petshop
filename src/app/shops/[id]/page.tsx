// หน้ารายละเอียดร้านค้า + สินค้าในร้าน
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

// โหลดร้านค้าและสินค้า ACTIVE
export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: { products: { where: { status: "ACTIVE" } } }
  });
  if (!shop) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="card overflow-hidden">
        <div className="aspect-[3/1] w-full bg-slate-100">
          {shop.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.coverUrl} alt={shop.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-5xl">🏪</div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-800">🏪 {shop.name}</h1>
          <div className="mt-1 text-sm text-slate-500">
            {shop.province ?? "—"} {shop.phone ? `· ☎ ${shop.phone}` : ""}
          </div>
          <p className="mt-4 whitespace-pre-wrap text-slate-700">{shop.description ?? "—"}</p>
          {shop.latitude && shop.longitude && (
            <a
              className="mt-3 inline-block text-sm text-brand-700 hover:underline"
              target="_blank" rel="noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`}
            >
              📍 ดูบนแผนที่
            </a>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold text-slate-800">สินค้าของร้าน</h2>
      {shop.products.length === 0 ? (
        <div className="card p-6 text-center text-slate-500">ยังไม่มีสินค้า</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {shop.products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              category={p.category}
              petType={p.petType}
              price={p.price}
              imageUrl={p.imageUrl}
              stock={p.stock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
