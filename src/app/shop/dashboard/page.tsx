// แดชบอร์ดร้านค้า: สรุปสถิติและออเดอร์ล่าสุด
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB, formatDate, ORDER_STATUS_LABEL } from "@/lib/utils";
import { 
  ShoppingBag, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Sparkles,
  ClipboardList
} from "lucide-react";

export const dynamic = "force-dynamic";

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: "รอการยืนยัน",
  CONFIRMED: "ยืนยันแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก"
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  GROOMING: "ตัดแต่งขน (Grooming)",
  PET_HOTEL: "โรงแรมสัตว์เลี้ยง",
  SPA: "สปาสัตว์เลี้ยง",
  VACCINATION: "ฉีดวัคซีน"
};

// โหลดข้อมูลร้านและสถิติยอดขายโดยประมาณ
export default async function ShopDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });

  if (!shop) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-slate-800">ยังไม่มีร้านค้าในระบบ</h1>
        <p className="mb-6 text-sm text-slate-500">สร้างร้านค้าและกรอกข้อมูลของคุณให้เรียบร้อยเพื่อเริ่มต้นลงขายสินค้าและสัตว์เลี้ยง</p>
        <Link href="/shop/profile" className="btn-primary inline-flex items-center gap-2">
          สร้างร้านค้าใหม่ <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const [
    productCount, 
    orderItems, 
    recentOrders,
    bookingsCount,
    recentBookings,
    lowStockProducts,
    allServicesBookings
  ] = await Promise.all([
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
    }),
    prisma.booking.count({ where: { shopId: shop.id } }),
    prisma.booking.findMany({
      where: { shopId: shop.id },
      include: { user: { select: { name: true } } },
      orderBy: { dateTime: "desc" },
      take: 5
    }),
    prisma.product.findMany({
      where: { shopId: shop.id, stock: { lte: 5 } },
      take: 5
    }),
    prisma.booking.findMany({
      where: { shopId: shop.id, status: { not: "CANCELLED" } },
      select: { price: true }
    })
  ]);

  const productRevenue = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceRevenue = allServicesBookings.reduce((s, b) => s + b.price, 0);
  const totalRevenue = productRevenue + serviceRevenue;

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PAID":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PENDING_PAYMENT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PREPARING":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "SHIPPED":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "CANCELLED":
        return "bg-slate-50 text-slate-500 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getBookingStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CANCELLED":
        return "bg-slate-50 text-slate-500 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">แดชบอร์ดจัดการร้านค้า</h1>
          <p className="text-sm text-slate-500">ข้อมูลความเคลื่อนไหว ยอดขาย และสถานะงานจองของร้านคุณ</p>
        </div>
        {shop.status !== "APPROVED" && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            สถานะร้านค้า: {shop.status === "PENDING" ? "กำลังรอตรวจสอบเพื่ออนุมัติ" : shop.status}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Product Revenue */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between hover:shadow-md hover:shadow-slate-100/50 transition-all duration-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">ยอดขายสินค้าสะสม</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{formatTHB(productRevenue)}</div>
            <div className="text-[10px] text-slate-400 mt-1">ยอดโอนจากสัตว์เลี้ยงและอาหารสัตว์</div>
          </div>
        </div>

        {/* Metric 2: Service Revenue */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between hover:shadow-md hover:shadow-slate-100/50 transition-all duration-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">ยอดบริการจองคิวสะสม</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{formatTHB(serviceRevenue)}</div>
            <div className="text-[10px] text-slate-400 mt-1">รายได้จากการอาบน้ำ โรงแรม และสปา</div>
          </div>
        </div>

        {/* Metric 3: Total Gross Revenue */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200 text-white border border-brand-800">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-brand-100">รวมรายได้ทั้งหมด</span>
            <div className="p-2.5 rounded-xl bg-white/10 text-white shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight">{formatTHB(totalRevenue)}</div>
            <div className="text-[10px] text-brand-200 mt-1">ยอดขายสินค้า + ยอดจองคิวบริการ</div>
          </div>
        </div>

        {/* Metric 4: Bookings Count */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between hover:shadow-md hover:shadow-slate-100/50 transition-all duration-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">คิวงานจองทั้งหมด</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{bookingsCount} รายการ</div>
            <Link href="/shop/bookings" className="text-[10px] text-brand-700 font-semibold hover:underline mt-1 inline-block">
              ดูตารางคิวงานจอง &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Warning Center (Low stock alert) */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl bg-rose-50/70 border border-rose-100 p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>แจ้งเตือน: สินค้าใกล้หมดสต็อก! (เหลือน้อยกว่า 5 ชิ้น)</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white border border-rose-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 truncate pr-2">{p.name}</span>
                <span className="shrink-0 rounded bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5">
                  คงเหลือ: {p.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Lists Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-slate-400" />
              <span>คำสั่งซื้อล่าสุด</span>
            </h2>
            <Link href="/shop/orders" className="text-xs font-semibold text-brand-700 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm bg-white">
            {recentOrders.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">ยังไม่มีคำสั่งซื้อที่เข้ามาในขณะนี้</p>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                    <th className="p-3">รหัสสั่งซื้อ</th>
                    <th className="p-3">ลูกค้า</th>
                    <th className="p-3">ยอดรวม</th>
                    <th className="p-3">สถานะออร์เดอร์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-800">#{o.id.slice(-8).toUpperCase()}</td>
                      <td className="p-3">{o.user.name}</td>
                      <td className="p-3 font-semibold text-slate-900">{formatTHB(o.total)}</td>
                      <td className="p-3">
                        <span className={`badge border px-2.5 py-0.5 rounded-full ${getOrderStatusBadgeClass(o.status)}`}>
                          {ORDER_STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Bookings Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span>จองคิวล่าสุด</span>
            </h2>
            <Link href="/shop/bookings" className="text-xs font-semibold text-brand-700 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-3">
            {recentBookings.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">ยังไม่มีประวัติการจองคิว</p>
            ) : (
              recentBookings.map((b) => (
                <div key={b.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 truncate max-w-[130px]">{b.user.name} ({b.petName})</span>
                    <span className={`badge border px-2 py-0.2 rounded-full text-[10px] ${getBookingStatusBadgeClass(b.status)}`}>
                      {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {SERVICE_TYPE_LABEL[b.serviceType] ?? b.serviceType}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded">
                    <span>นัดหมาย:</span>
                    <span className="font-medium text-slate-800">{formatDate(b.dateTime)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

