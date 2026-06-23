// หน้าคำสั่งซื้อของร้านค้า
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB, formatDate, ORDER_STATUS_LABEL } from "@/lib/utils";
import OrderStatusSelect from "./OrderStatusSelect";

export const dynamic = "force-dynamic";

// โหลดออเดอร์ที่มีสินค้าของร้านนี้
export default async function ShopOrdersPage() {
  const session = await auth();
  const shop = await prisma.shop.findUnique({ where: { ownerId: session!.user.id } });
  if (!shop) return <div className="card p-6 text-center text-slate-500">กรุณาตั้งค่าร้านก่อน</div>;

  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { shopId: shop.id } } } },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { shopId: true, name: true } } } },
      payment: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">คำสั่งซื้อของร้าน</h1>

      {orders.length === 0 ? (
        <div className="card p-6 text-center text-slate-500">ยังไม่มีคำสั่งซื้อ</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const myItems = o.items.filter((i) => i.product?.shopId === shop.id);
            const mySubtotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
            return (
              <div key={o.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">#{o.id.slice(-8).toUpperCase()} · {formatDate(o.createdAt)}</div>
                    <div className="text-sm">ลูกค้า: {o.user.name} ({o.user.email})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">ยอดในร้านนี้</div>
                    <div className="font-semibold text-brand-700">{formatTHB(mySubtotal)}</div>
                  </div>
                </div>

                <ul className="mt-3 text-sm">
                  {myItems.map((i) => (
                    <li key={i.id} className="flex justify-between border-t border-slate-100 py-1">
                      <span>{i.name} × {i.quantity}</span>
                      <span>{formatTHB(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="badge bg-slate-100 text-slate-800">{ORDER_STATUS_LABEL[o.status]}</span>
                  {o.payment && <span className="badge bg-slate-100 text-slate-800">การชำระ: {o.payment.status}</span>}
                  {o.trackingNumber && (
                    <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono">
                      เลขพัสดุ: {o.trackingNumber}
                    </span>
                  )}
                  <div className="ml-auto">
                    <OrderStatusSelect orderId={o.id} status={o.status} trackingNumber={o.trackingNumber} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
