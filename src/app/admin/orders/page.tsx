// หน้าแอดมินดูคำสั่งซื้อทั้งหมด
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTHB, formatDate, ORDER_STATUS_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

// โหลดออเดอร์ทั้งหมดพร้อมผู้ใช้และการชำระเงิน
export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: { select: { name: true, email: true } }, payment: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">คำสั่งซื้อทั้งหมด</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">#</th><th className="p-3">ลูกค้า</th><th className="p-3">ยอด</th><th className="p-3">สถานะคำสั่ง</th><th className="p-3">สถานะชำระ</th><th className="p-3">วันที่</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="p-3 font-mono">
                  <Link href={`/orders/${o.id}`} className="text-brand-700 hover:underline">#{o.id.slice(-8).toUpperCase()}</Link>
                </td>
                <td className="p-3">{o.user.name}<div className="text-xs text-slate-500">{o.user.email}</div></td>
                <td className="p-3">{formatTHB(o.total)}</td>
                <td className="p-3">{ORDER_STATUS_LABEL[o.status]}</td>
                <td className="p-3">{o.payment?.status ?? "—"}</td>
                <td className="p-3">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
