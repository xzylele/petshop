// หน้ารายการคำสั่งซื้อของผู้ใช้
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB, formatDate, ORDER_STATUS_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

// โหลดออเดอร์ของผู้ใช้ตามตัวกรองแท็บ
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  const sp = await searchParams;
  const activeTab = sp.tab || "all";

  // กำหนดเงื่อนไขฟิลเตอร์ตามแท็บที่เลือก
  const where: any = { userId: session.user.id };
  if (activeTab === "PENDING_PAYMENT") {
    where.status = "PENDING_PAYMENT";
  } else if (activeTab === "PROCESSING") {
    where.status = { in: ["PAID", "PREPARING", "SHIPPED"] };
  } else if (activeTab === "COMPLETED") {
    where.status = "COMPLETED";
  } else if (activeTab === "CANCELLED") {
    where.status = "CANCELLED";
  }

  const orders = await prisma.order.findMany({
    where,
    include: { payment: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" }
  });

  const tabs = [
    { id: "all", label: "ทั้งหมด" },
    { id: "PENDING_PAYMENT", label: "รอชำระเงิน" },
    { id: "PROCESSING", label: "กำลังจัดส่ง/เตรียมของ" },
    { id: "COMPLETED", label: "สำเร็จแล้ว" },
    { id: "CANCELLED", label: "ยกเลิกแล้ว" }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">คำสั่งซื้อของฉัน</h1>

      {/* แถบแท็บฟิลเตอร์สถานะ */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto pb-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id === "all" ? "/orders" : `/orders?tab=${tab.id}`}
                className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-brand-600 text-brand-700 font-bold"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="mb-4 text-slate-500">
            {activeTab === "all" ? "ยังไม่มีคำสั่งซื้อ" : "ไม่มีคำสั่งซื้อในสถานะนี้"}
          </p>
          <Link href="/products" className="btn-primary">เริ่มซื้อสินค้า</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center justify-between p-4 hover:shadow-md">
              <div>
                <div className="text-xs text-slate-500">#{o.id.slice(-8).toUpperCase()} · {formatDate(o.createdAt)}</div>
                <div className="font-medium text-slate-800">{o._count.items} รายการ · {formatTHB(o.total)}</div>
              </div>
              <div>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// แสดงป้ายสถานะคำสั่งซื้อแบบสีต่างกัน
function StatusBadge({ status }: { status: string }) {
  const color =
    status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
    status === "PAID" || status === "PREPARING" || status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
    status === "CANCELLED" ? "bg-red-100 text-red-700" :
    "bg-amber-100 text-amber-800";
  return <span className={`badge ${color}`}>{ORDER_STATUS_LABEL[status] ?? status}</span>;
}
