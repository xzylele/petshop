// แดชบอร์ดแอดมิน: สรุปสถิติระบบ
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";

export const dynamic = "force-dynamic";

// โหลดตัวเลขสรุปและยอดรวม
export default async function AdminDashboardPage() {
  const [users, shops, products, animals, farms, orders, paidOrders, pendingShops, pendingPayments] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.product.count(),
    prisma.animal.count(),
    prisma.farm.count(),
    prisma.order.count(),
    prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, select: { total: true } }),
    prisma.shop.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "SUBMITTED" } })
  ]);

  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">ภาพรวมระบบ</h1>

      {(pendingShops > 0 || pendingPayments > 0) && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          🔔 ต้องดำเนินการ:
          {pendingShops > 0 && <> มีร้านค้ารอตรวจสอบ <strong>{pendingShops}</strong> ราย</>}
          {pendingPayments > 0 && <> · มีสลิปรอตรวจสอบ <strong>{pendingPayments}</strong> รายการ</>}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Stat label="ผู้ใช้" value={users} />
        <Stat label="ร้านค้า" value={shops} />
        <Stat label="สินค้า" value={products} />
        <Stat label="สัตว์ในระบบ" value={animals} />
        <Stat label="ฟาร์ม" value={farms} />
        <Stat label="คำสั่งซื้อ" value={orders} />
        <Stat label="ยอดขายรวม (อนุมัติ)" value={formatTHB(revenue)} />
      </div>
    </div>
  );
}

// การ์ดตัวเลขสรุป
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
