// หน้าแอดมินจัดการฟาร์ม
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// โหลดฟาร์มทั้งหมดพร้อมจำนวนสัตว์
export default async function AdminFarmsPage() {
  const farms = await prisma.farm.findMany({
    include: { _count: { select: { animals: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">จัดการฟาร์ม</h1>
        <Link href="/admin/farms/new" className="btn-primary">+ เพิ่มฟาร์ม</Link>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">ชื่อฟาร์ม</th><th className="p-3">จังหวัด</th><th className="p-3">สัตว์</th><th className="p-3">สถานะ</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {farms.map((f) => (
              <tr key={f.id} className="border-t border-slate-100">
                <td className="p-3 font-medium">{f.name}</td>
                <td className="p-3">{f.province ?? "—"}</td>
                <td className="p-3">{f._count.animals}</td>
                <td className="p-3">{f.status}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/farms/${f.id}/edit`} className="text-brand-700 hover:underline">แก้ไข</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
