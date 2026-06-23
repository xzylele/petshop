// แดชบอร์ดแอดมิน: สรุปสถิติระบบ
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";
import Link from "next/link";
import { 
  Users, 
  Store, 
  ShoppingBag, 
  PawPrint, 
  Home, 
  ClipboardList, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  CreditCard
} from "lucide-react";

export const dynamic = "force-dynamic";

// โหลดตัวเลขสรุปและยอดรวม
export default async function AdminDashboardPage() {
  const [
    usersCount, 
    shopsCount, 
    productsCount, 
    animalsCount, 
    farmsCount, 
    ordersCount, 
    paidOrders, 
    pendingShopsCount, 
    pendingPaymentsCount,
    recentPendingShops,
    recentPendingPayments
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.product.count(),
    prisma.animal.count(),
    prisma.farm.count(),
    prisma.order.count(),
    prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, select: { total: true } }),
    prisma.shop.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "SUBMITTED" } }),
    prisma.shop.findMany({ where: { status: "PENDING" }, take: 3, include: { owner: true } }),
    prisma.payment.findMany({ where: { status: "SUBMITTED" }, take: 3, include: { order: { include: { user: true } } } })
  ]);

  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: "ผู้ใช้งานในระบบ", value: usersCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "ร้านค้าทั้งหมด", value: shopsCount, icon: Store, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "ฟาร์มสัตว์เลี้ยง", value: farmsCount, icon: Home, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "สินค้าทั้งหมด", value: productsCount, icon: ShoppingBag, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { label: "สัตว์เลี้ยงในระบบ", value: animalsCount, icon: PawPrint, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { label: "คำสั่งซื้อทั้งหมด", value: ordersCount, icon: ClipboardList, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ภาพรวมระบบและสถิติหลัก</h1>
        <p className="text-sm text-slate-500">รายงานข้อมูลระบบและการดำเนินการที่ต้องจัดการสำหรับผู้ดูแลระบบ</p>
      </div>

      {/* Revenue Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white shadow-lg shadow-brand-100">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <TrendingUp className="h-48 w-48" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-100">ยอดขายรวมที่ชำระเงินแล้วในระบบ</p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight">{formatTHB(revenue)}</h2>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/10 self-start sm:self-auto text-xs font-semibold tracking-wide uppercase">
            อัปเดตแบบเรียลไทม์
          </div>
        </div>
      </div>

      {/* Urgent Action Alerts */}
      {(pendingShopsCount > 0 || pendingPaymentsCount > 0) && (
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>มีรายการที่รอการอนุมัติและตรวจสอบจากคุณ</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingShopsCount > 0 && (
              <div className="bg-white border border-amber-100 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs text-slate-500">ร้านค้ารอตรวจสอบ</div>
                  <div className="mt-0.5 text-lg font-bold text-slate-800">{pendingShopsCount} ร้าน</div>
                </div>
                <Link href="/admin/shops" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
                  ไปตรวจสอบ <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
            {pendingPaymentsCount > 0 && (
              <div className="bg-white border border-amber-100 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs text-slate-500">สลิปการโอนรออนุมัติ</div>
                  <div className="mt-0.5 text-lg font-bold text-slate-800">{pendingPaymentsCount} รายการ</div>
                </div>
                <Link href="/admin/payments" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
                  ไปตรวจสอบ <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`rounded-xl border ${stat.border} p-5 flex flex-col justify-between hover:shadow-md hover:shadow-slate-100/50 transition-all duration-200 bg-white`}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-500 truncate">{stat.label}</span>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                {stat.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Lists Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Pending Shops */}
        <div className="border border-slate-100 rounded-2xl p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>คำขอเปิดร้านค้าล่าสุด</span>
            </h3>
            <Link href="/admin/shops" className="text-xs font-semibold text-brand-700 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPendingShops.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">ไม่มีคำขอเปิดร้านค้าใหม่</p>
            ) : (
              recentPendingShops.map((shop) => (
                <div key={shop.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="truncate">
                    <p className="font-semibold text-xs text-slate-800 truncate">{shop.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">โดย: {shop.owner.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                    รอตรวจสอบ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Pending Payments */}
        <div className="border border-slate-100 rounded-2xl p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>สลิปรอการตรวจสอบล่าสุด</span>
            </h3>
            <Link href="/admin/payments" className="text-xs font-semibold text-brand-700 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPendingPayments.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">ไม่มีสลิปรอตรวจสอบ</p>
            ) : (
              recentPendingPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="truncate">
                    <p className="font-semibold text-xs text-slate-800 truncate">ออร์เดอร์ #{p.orderId.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">ยอดโอน: {formatTHB(p.amount)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                    ส่งสลิปแล้ว
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

