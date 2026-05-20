// หน้าแอดมินดูสินค้าทั้งหมด
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";

export const dynamic = "force-dynamic";

// โหลดสินค้าพร้อมชื่อร้านที่ขาย
export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { shop: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">สินค้าทั้งหมด</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">ชื่อ</th><th className="p-3">ร้าน</th><th className="p-3">หมวด</th><th className="p-3">ราคา</th><th className="p-3">สต็อก</th><th className="p-3">สถานะ</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.shop?.name}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{formatTHB(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
