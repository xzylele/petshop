// หน้ารายละเอียดสินค้า: ดึงข้อมูลสินค้าและร้านค้า
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

// โหลดสินค้าแล้วแสดงปุ่มเพิ่มตะกร้า
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { shop: true }
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="aspect-square w-full bg-slate-100">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">ไม่มีรูป</div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm text-slate-500">{product.category}{product.petType ? ` · ${product.petType}` : ""}</div>
          <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
          <div className="mt-3 text-3xl font-bold text-brand-700">{formatTHB(product.price)}</div>

          <div className="mt-2 text-sm text-slate-600">
            สต็อก: {product.stock > 0 ? <span className="text-emerald-700">มีสินค้า ({product.stock})</span> : <span className="text-red-600">หมด</span>}
          </div>

          <p className="mt-4 whitespace-pre-wrap text-slate-700">{product.description ?? "—"}</p>

          {product.shop && (
            <div className="card mt-4 p-4">
              <div className="text-xs text-slate-500">ขายโดย</div>
              <Link href={`/shops/${product.shop.id}`} className="text-brand-700 hover:underline">
                🏪 {product.shop.name}
              </Link>
              {product.shop.province && <div className="text-xs text-slate-500">{product.shop.province}</div>}
            </div>
          )}

          <div className="mt-6">
            <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
          </div>
        </div>
      </div>
    </div>
  );
}
