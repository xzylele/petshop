// หน้าแอดมินจัดการร้านค้า
import { prisma } from "@/lib/prisma";
import ShopActions from "./ShopActions";

export const dynamic = "force-dynamic";

// โหลดร้านค้าพร้อมข้อมูลเจ้าของ
export default async function AdminShopsPage() {
  const shops = await prisma.shop.findMany({
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">จัดการร้านค้า</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">ชื่อร้าน</th><th className="p-3">เจ้าของ</th><th className="p-3">จังหวัด</th><th className="p-3">สถานะ</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {shops.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.owner.name} ({s.owner.email})</td>
                <td className="p-3">{s.province ?? "—"}</td>
                <td className="p-3">{s.status}</td>
                <td className="p-3 text-right"><ShopActions id={s.id} status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
