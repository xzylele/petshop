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
      include: { order: { select: { createdAt: true } } }
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
      select: { price: true, dateTime: true, serviceType: true, status: true }
    })
  ]);

  const productRevenue = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceRevenue = allServicesBookings.reduce((s, b) => s + b.price, 0);
  const totalRevenue = productRevenue + serviceRevenue;

  // --- คำนวณรายได้รายเดือนย้อนหลัง 6 เดือนสำหรับกราฟแท่ง ---
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const last6Months: {
    year: number;
    month: number;
    label: string;
    productRevenue: number;
    serviceRevenue: number;
    total: number;
  }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
      productRevenue: 0,
      serviceRevenue: 0,
      total: 0
    });
  }

  // คำนวณรายได้สินค้า
  orderItems.forEach(item => {
    const itemDate = item.order.createdAt;
    const itemYear = itemDate.getFullYear();
    const itemMonth = itemDate.getMonth();
    const monthBin = last6Months.find(m => m.year === itemYear && m.month === itemMonth);
    if (monthBin) {
      monthBin.productRevenue += item.price * item.quantity;
    }
  });

  // คำนวณรายได้บริการ
  allServicesBookings.forEach(booking => {
    const bDate = booking.dateTime;
    const bYear = bDate.getFullYear();
    const bMonth = bDate.getMonth();
    const monthBin = last6Months.find(m => m.year === bYear && m.month === bMonth);
    if (monthBin) {
      monthBin.serviceRevenue += booking.price;
    }
  });

  last6Months.forEach(m => {
    m.total = m.productRevenue + m.serviceRevenue;
  });

  // หาจุดสูงสุดสำหรับกำหนด Scale ของกราฟ
  const maxMonthlyRevenue = Math.max(...last6Months.map(m => m.total), 10000);

  // --- คำนวณสัดส่วนบริการสำหรับการฟวงกลม Donut ---
  let groomingCount = 0;
  let spaCount = 0;
  let hotelCount = 0;
  allServicesBookings.forEach(b => {
    if (b.serviceType === "GROOMING") groomingCount++;
    else if (b.serviceType === "SPA") spaCount++;
    else if (b.serviceType === "PET_HOTEL") hotelCount++;
  });
  const totalServiceBookings = groomingCount + spaCount + hotelCount;

  const groomingPct = totalServiceBookings > 0 ? (groomingCount / totalServiceBookings) : 0;
  const spaPct = totalServiceBookings > 0 ? (spaCount / totalServiceBookings) : 0;
  const hotelPct = totalServiceBookings > 0 ? (hotelCount / totalServiceBookings) : 0;

  // สำหรับวาดวงกลม (C = 226.2)
  const strokeGrooming = 226.2 * groomingPct;
  const strokeSpa = 226.2 * spaPct;
  const strokeHotel = 226.2 * hotelPct;
  const offsetGrooming = 0;
  const offsetSpa = strokeGrooming;
  const offsetHotel = strokeGrooming + strokeSpa;

  // --- คำนวณดัชนีผลการจอง ---
  const totalBookingsCount = await prisma.booking.count({ where: { shopId: shop.id } });
  const cancelledBookingsCount = await prisma.booking.count({ where: { shopId: shop.id, status: "CANCELLED" } });
  const completedBookingsCount = await prisma.booking.count({ where: { shopId: shop.id, status: "COMPLETED" } });
  const pendingBookingsCount = await prisma.booking.count({ where: { shopId: shop.id, status: "PENDING" } });

  const completionRate = totalBookingsCount > 0 ? Math.round((completedBookingsCount / totalBookingsCount) * 100) : 0;
  const cancellationRate = totalBookingsCount > 0 ? Math.round((cancelledBookingsCount / totalBookingsCount) * 100) : 0;

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

      {/* Visual Analytics Graphs Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Revenue Bar Chart (Last 6 Months) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">สถิติรายได้ 6 เดือนย้อนหลัง</h3>
              <p className="text-[10px] text-slate-400">เปรียบเทียบยอดขายสินค้าและยอดจองบริการ</p>
            </div>
            <div className="flex gap-3 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm"></span> ยอดขายสินค้า</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> ยอดบริการจอง</span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative w-full h-[220px]">
            <svg viewBox="0 0 540 220" className="w-full h-full text-slate-300">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="65" x2="520" y2="65" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="110" x2="520" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="155" x2="520" y2="155" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="180" x2="520" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Y-Axis Labels */}
              <text x="32" y="24" textAnchor="end" className="text-[9px] fill-slate-400 font-semibold">{formatTHB(maxMonthlyRevenue)}</text>
              <text x="32" y="104" textAnchor="end" className="text-[9px] fill-slate-400 font-semibold">{formatTHB(maxMonthlyRevenue / 2)}</text>
              <text x="32" y="184" textAnchor="end" className="text-[9px] fill-slate-400 font-semibold">0 บ.</text>

              {/* Bars */}
              {last6Months.map((m, idx) => {
                const colWidth = 80;
                const startX = 60 + idx * colWidth;
                const barWidth = 16;
                const gap = 4;

                // คำนวณความสูง (Max height = 150px)
                const productBarH = (m.productRevenue / maxMonthlyRevenue) * 150;
                const serviceBarH = (m.serviceRevenue / maxMonthlyRevenue) * 150;

                const productY = 180 - productBarH;
                const serviceY = 180 - serviceBarH;

                return (
                  <g key={idx} className="group cursor-pointer">
                    {/* Tooltip Background & Text on hover (handled by CSS/Tailwind group hover) */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect x={startX - 15} y={Math.min(productY, serviceY) - 32} width="90" height="26" rx="6" fill="#1e293b" />
                      <text x={startX + 30} y={Math.min(productY, serviceY) - 15} textAnchor="middle" className="text-[9px] fill-white font-bold">
                        รวม: {formatTHB(m.total)}
                      </text>
                    </g>

                    {/* Product Bar (Sky) */}
                    <rect
                      x={startX}
                      y={productY}
                      width={barWidth}
                      height={productBarH}
                      rx="3"
                      fill="#0ea5e9"
                      className="transition-all duration-300 hover:fill-sky-400"
                    />

                    {/* Service Bar (Indigo) */}
                    <rect
                      x={startX + barWidth + gap}
                      y={serviceY}
                      width={barWidth}
                      height={serviceBarH}
                      rx="3"
                      fill="#6366f1"
                      className="transition-all duration-300 hover:fill-indigo-400"
                    />

                    {/* Month Label */}
                    <text x={startX + barWidth} y="200" textAnchor="middle" className="text-[10px] fill-slate-500 font-bold">
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Service Type Donut Chart */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3 mb-2">
            <h3 className="font-bold text-slate-800 text-sm">สัดส่วนบริการจองคิว</h3>
            <p className="text-[10px] text-slate-400">แบ่งตามประเภทบริการทั้งหมด</p>
          </div>

          <div className="flex items-center justify-around py-2">
            {/* SVG Donut */}
            {totalServiceBookings === 0 ? (
              <div className="w-24 h-24 rounded-full border-4 border-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                ไม่มีข้อมูล
              </div>
            ) : (
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f8fafc" strokeWidth="10" />

                  {/* Grooming slice (Sky) */}
                  {groomingCount > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#0ea5e9"
                      strokeWidth="10"
                      strokeDasharray={`${strokeGrooming} 226.2`}
                      strokeDashoffset={-offsetGrooming}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Spa slice (Pink) */}
                  {spaCount > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#ec4899"
                      strokeWidth="10"
                      strokeDasharray={`${strokeSpa} 226.2`}
                      strokeDashoffset={-offsetSpa}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Pet Hotel slice (Indigo) */}
                  {hotelCount > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#6366f1"
                      strokeWidth="10"
                      strokeDasharray={`${strokeHotel} 226.2`}
                      strokeDashoffset={-offsetHotel}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-slate-800">{totalServiceBookings}</span>
                  <span className="text-[8px] text-slate-400 font-semibold uppercase">การจอง</span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-col gap-2 text-[10px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span> 
                ตัดขน: {groomingCount} ({Math.round(groomingPct * 100)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-pink-500 rounded-full"></span> 
                สปา: {spaCount} ({Math.round(spaPct * 100)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> 
                ฝากเลี้ยง: {hotelCount} ({Math.round(hotelPct * 100)}%)
              </span>
            </div>
          </div>

          {/* Stats rate summary */}
          <div className="border-t border-slate-50 pt-3 space-y-2 text-[10px]">
            <div>
              <div className="flex justify-between font-semibold text-slate-600 mb-1">
                <span>อัตราการให้บริการสำเร็จ</span>
                <span className="text-emerald-600 font-bold">{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold text-slate-600 mb-1">
                <span>อัตราการยกเลิกคิวงาน</span>
                <span className="text-rose-600 font-bold">{cancellationRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${cancellationRate}%` }}></div>
              </div>
            </div>
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

