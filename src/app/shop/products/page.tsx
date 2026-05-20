// หน้าสินค้าของร้านค้า
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";

export const dynamic = "force-dynamic";

// โหลดสินค้าของร้านตาม ownerId
export default async function ShopProductsPage() {
  const session = await auth();
  const shop = await prisma.shop.findUnique({ where: { ownerId: session!.user.id } });

  if (!shop) {
    return <div className="card p-6 text-center text-slate-500">กรุณาตั้งค่าร้านค้าก่อน</div>;
  }

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">สินค้าของร้าน</h1>
        <Link href="/shop/products/new" className="btn-primary">+ เพิ่มสินค้า</Link>
      </div>

      <div className="card overflow-hidden">
        {products.length === 0 ? (
          <p className="p-6 text-center text-slate-500">ยังไม่มีสินค้า กดเพิ่มสินค้าใหม่</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="p-3">ชื่อ</th><th className="p-3">หมวดหมู่</th><th className="p-3">ราคา</th><th className="p-3">สต็อก</th><th className="p-3">สถานะ</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">{formatTHB(p.price)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3 text-right">
                    <Link href={`/shop/products/${p.id}/edit`} className="text-brand-700 hover:underline">แก้ไข</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
