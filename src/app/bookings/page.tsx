import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTHB } from "@/lib/utils";
import CancelBookingButton from "@/app/profile/CancelBookingButton";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  Phone, 
  Sparkles, 
  Scissors, 
  Home, 
  Droplet, 
  FileText, 
  PlusCircle,
  Clock,
  Dog,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

const SERVICE_INFO: Record<string, { label: string; icon: any; color: string }> = {
  GROOMING: {
    label: "อาบน้ำตัดแต่งขน (Grooming)",
    icon: Scissors,
    color: "text-sky-600 bg-sky-50 border-sky-100"
  },
  PET_HOTEL: {
    label: "โรงแรมสัตว์เลี้ยง (Pet Hotel)",
    icon: Home,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100"
  },
  SPA: {
    label: "สปาสัตว์เลี้ยง (Spa)",
    icon: Droplet,
    color: "text-pink-600 bg-pink-50 border-pink-100"
  },
  VACCINATION: {
    label: "ฉีดวัคซีนและสุขภาพ (Vaccination)",
    icon: Sparkles,
    color: "text-teal-600 bg-teal-50 border-teal-100"
  }
};

const STATUS_INFO: Record<string, { label: string; badgeClass: string }> = {
  PENDING: {
    label: "รอการยืนยัน",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200"
  },
  CONFIRMED: {
    label: "ยืนยันการจองแล้ว",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200"
  },
  COMPLETED: {
    label: "เสร็จสิ้นบริการ",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  CANCELLED: {
    label: "ยกเลิกแล้ว",
    badgeClass: "bg-slate-50 text-slate-500 border-slate-200"
  }
};

export default async function CustomerBookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/bookings");
  }

  const sp = await searchParams;
  const activeTab = sp.tab || "all";

  // กำหนดเงื่อนไขฟิลเตอร์ตามสถานะแท็บ
  const where: any = { userId: session.user.id };
  if (activeTab !== "all") {
    where.status = activeTab;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      shop: {
        select: {
          name: true,
          phone: true,
          address: true
        }
      }
    },
    orderBy: {
      dateTime: "desc"
    }
  });

  const tabs = [
    { id: "all", label: "ทั้งหมด" },
    { id: "PENDING", label: "รอการยืนยัน" },
    { id: "CONFIRMED", label: "ยืนยันแล้ว" },
    { id: "COMPLETED", label: "เสร็จสิ้นบริการ" },
    { id: "CANCELLED", label: "ยกเลิกแล้ว" }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">การจองคิวของฉัน</h1>
          <p className="text-slate-500 mt-1">ประวัติการนัดหมาย อาบน้ำตัดขน ฝากเลี้ยง สปา และรับวัคซีนของสัตว์เลี้ยงของคุณ</p>
        </div>
        <div>
          <Link href="/shops" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            จองบริการใหม่
          </Link>
        </div>
      </div>

      {/* แถบแท็บฟิลเตอร์สถานะการจอง */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto pb-1" aria-label="Bookings status tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id === "all" ? "/bookings" : `/bookings?tab=${tab.id}`}
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

      {bookings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center max-w-xl mx-auto shadow-sm mt-8">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">ไม่พบข้อมูลการจองคิว</h2>
          <p className="text-sm text-slate-500 mb-6">
            {activeTab === "all"
              ? "คุณยังไม่ได้ทำการจองคิวบริการใดๆ เริ่มต้นจองคิวบริการสัตว์เลี้ยงกับร้านค้าพันธมิตรของเราได้เลย"
              : "ไม่พบประวัติการจองคิวที่ตรงกับสถานะนี้"}
          </p>
          <Link href="/shops" className="btn-primary inline-flex items-center gap-2">
            ดูร้านค้าที่มีให้บริการ <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const service = SERVICE_INFO[booking.serviceType] || {
              label: booking.serviceType,
              icon: Calendar,
              color: "text-slate-600 bg-slate-50 border-slate-100"
            };
            const status = STATUS_INFO[booking.status] || {
              label: booking.status,
              badgeClass: "bg-slate-50 text-slate-700 border-slate-200"
            };
            const IconComponent = service.icon;

            const dateStr = new Date(booking.dateTime).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const timeStr = new Date(booking.dateTime).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={booking.id}
                className="overflow-hidden rounded-2xl border border-slate-150 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Upper row: Service title, status */}
                <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${service.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                        {service.label}
                      </h3>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
                        ID: #{booking.id.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 grid gap-6 md:grid-cols-3">
                  {/* Shop Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ข้อมูลร้านค้า</h4>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">🏪 {booking.shop.name}</div>
                      {booking.shop.phone && (
                        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {booking.shop.phone}
                        </div>
                      )}
                      {booking.shop.address && (
                        <div className="mt-1 text-xs text-slate-500 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{booking.shop.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pet Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ข้อมูลสัตว์เลี้ยง</h4>
                    <div className="rounded-xl bg-slate-50 p-3.5 flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg border border-slate-100 text-slate-500">
                        <Dog className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">{booking.petName}</div>
                        <div className="text-slate-500 mt-0.5">ประเภท: {booking.petType}</div>
                        {booking.petWeight && (
                          <div className="text-slate-500 mt-0.5">น้ำหนัก: {booking.petWeight} กก.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Price */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">นัดหมาย & ค่าบริการ</h4>
                    <div className="text-xs text-slate-600 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>นัดวันที่: <strong className="text-slate-800">{dateStr}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>เวลานัด: <strong className="text-slate-800">{timeStr} น.</strong></span>
                      </div>
                      {booking.serviceType === "PET_HOTEL" && booking.checkOutDateTime && (
                        <div className="mt-1 rounded border border-indigo-100 bg-indigo-50/30 p-2 text-[11px] text-indigo-800">
                          <div className="font-semibold">เช็คเอาท์:</div>
                          <div>
                            {new Date(booking.checkOutDateTime).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })} เวลา {new Date(booking.checkOutDateTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น. ({booking.days} วัน)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Extra Notes & Footer Cancellation Bar */}
                <div className="px-6 pb-6 pt-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    {booking.notes && (
                      <div className="flex items-start gap-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-700">คำขอเพิ่มเติม: </span>
                          <span className="italic">"{booking.notes}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-4 border-t border-slate-100 sm:border-t-0 sm:pt-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ค่าบริการโดยประมาณ</div>
                      <div className="text-xl font-extrabold text-brand-600">{formatTHB(booking.price)}</div>
                    </div>
                    {booking.status === "PENDING" && (
                      <div className="shrink-0">
                        <CancelBookingButton bookingId={booking.id} />
                      </div>
                    )}
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
