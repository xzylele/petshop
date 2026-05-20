// แดชบอร์ดร้านค้า: สรุปสถิติและออเดอร์ล่าสุด
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";

export const dynamic = "force-dynamic";

// โหลดข้อมูลร้านและสถิติยอดขายโดยประมาณ
export default async function ShopDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });

  if (!shop) {
    return (
      <div className="card p-8 text-center">
        <h1 className="mb-2 text-xl font-bold">ยังไม่มีร้านค้า</h1>
        <p className="mb-4 text-slate-600">สร้างร้านค้าของคุณเพื่อเริ่มลงสินค้า</p>
        <Link href="/shop/profile" className="btn-primary">สร้างร้านค้า</Link>
      </div>
    );
  }

  const [productCount, orders, recentOrders] = await Promise.all([
    prisma.product.count({ where: { shopId: shop.id } }),
    prisma.orderItem.findMany({
      where: { product: { shopId: shop.id }, order: { status: { not: "CANCELLED" } } },
      select: { price: true, quantity: true }
    }),
    prisma.order.findMany({
      where: { items: { some: { product: { shopId: shop.id } } } },
      include: { items: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const revenue = orders.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">ภาพรวมร้าน {shop.name}</h1>

      {shop.status !== "APPROVED" && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          สถานะร้าน: <strong>{shop.status}</strong> — รอผู้ดูแลระบบอนุมัติ
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="สินค้าทั้งหมด" value={productCount.toString()} />
        <Stat label="คำสั่งซื้อรวม" value={recentOrders.length.toString() + "+"} />
        <Stat label="ยอดขายโดยประมาณ" value={formatTHB(revenue)} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">คำสั่งซื้อล่าสุด</h2>
      <div className="card overflow-hidden">
        {recentOrders.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">ยังไม่มีคำสั่งซื้อ</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="p-3">หมายเลข</th><th className="p-3">ลูกค้า</th><th className="p-3">ยอด</th><th className="p-3">สถานะ</th></tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="p-3 font-mono">#{o.id.slice(-8).toUpperCase()}</td>
                  <td className="p-3">{o.user.name}</td>
                  <td className="p-3">{formatTHB(o.total)}</td>
                  <td className="p-3">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// การ์ดตัวเลขสรุปของร้าน
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
