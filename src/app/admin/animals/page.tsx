// หน้าแอดมินจัดการสัตว์เลี้ยง
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

// โหลดรายการสัตว์ทั้งหมด
export default async function AdminAnimalsPage() {
  const animals = await prisma.animal.findMany({
    include: { farm: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">จัดการสัตว์</h1>
        <Link href="/admin/animals/new" className="btn-primary">+ เพิ่มสัตว์</Link>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">ชื่อ</th><th className="p-3">ประเภท</th><th className="p-3">สายพันธุ์</th><th className="p-3">ราคา</th><th className="p-3">ฟาร์ม</th><th className="p-3">แปลก?</th><th className="p-3">สถานะ</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {animals.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="p-3">{a.name ?? "—"}</td>
                <td className="p-3">{a.animalType}</td>
                <td className="p-3">{a.breed ?? "—"}</td>
                <td className="p-3">{formatTHB(a.price)}</td>
                <td className="p-3">{a.farm?.name ?? "—"}</td>
                <td className="p-3">{a.isExotic ? "ใช่" : "—"}</td>
                <td className="p-3">{a.status}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/animals/${a.id}/edit`} className="text-brand-700 hover:underline">แก้ไข</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
