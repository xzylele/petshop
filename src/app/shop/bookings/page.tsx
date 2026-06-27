import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingActionsClient from "./BookingActionsClient";

export const dynamic = "force-dynamic";

export default async function ShopBookingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  // ค้นหาร้านค้าของผู้ใช้
  const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });

  if (!shop) {
    return (
      <div className="card p-8 text-center">
        <h1 className="mb-2 text-xl font-bold">ยังไม่มีร้านค้า</h1>
        <p className="mb-4 text-slate-600">สร้างร้านค้าของคุณเพื่อรับการจองคิวบริการ</p>
      </div>
    );
  }

  // ดึงรายการจองของร้าน
  const bookings = await prisma.booking.findMany({
    where: { shopId: shop.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: { dateTime: "asc" }
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📅 การจองคิวบริการสัตว์เลี้ยง</h1>
          <p className="text-sm text-slate-500">จัดการคิวงาน อาบน้ำตัดขน และฝากเลี้ยงของร้านคุณ</p>
        </div>
      </div>

      {/* บล็อกสถิติคิว */}
      <div className="mb-6 grid gap-4 grid-cols-3">
        <div className="card p-4">
          <div className="text-xs text-slate-500">รอการยืนยัน</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">ยืนยันแล้ว/กำลังบริการ</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{confirmedCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">เสร็จสิ้นวันนี้</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{completedCount}</div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">รายการนัดหมายทั้งหมด</h2>

        {bookings.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-500">ยังไม่มีการจองคิวบริการในขณะนี้</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((b) => {
              const dateStr = new Date(b.dateTime).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric"
              });
              const timeStr = new Date(b.dateTime).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div key={b.id} className="py-4 first:pt-0 last:pb-0 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {b.serviceType === "GROOMING" && "✂️ อาบน้ำตัดขน"}
                        {b.serviceType === "PET_HOTEL" && "🏨 รับฝากเลี้ยง"}
                        {b.serviceType === "SPA" && "🛁 สปาสัตว์เลี้ยง"}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        b.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        b.status === "CONFIRMED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        b.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        {b.status === "PENDING" && "รอการยืนยัน"}
                        {b.status === "CONFIRMED" && "ยืนยันแล้ว"}
                        {b.status === "COMPLETED" && "เสร็จสิ้นบริการ"}
                        {b.status === "CANCELLED" && "ยกเลิกแล้ว"}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-700">
                      ลูกค้า: <strong>{b.user.name}</strong> · เบอร์โทร: <a href={`tel:${b.user.phone}`} className="text-brand-600 hover:underline">{b.user.phone ?? "—"}</a>
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      สัตว์เลี้ยง: <strong>{b.petName}</strong> ({b.petType}){b.petWeight ? ` · น้ำหนัก: ${b.petWeight} กก.` : ""}
                    </div>

                    {b.serviceType === "PET_HOTEL" && b.checkOutDateTime ? (
                      <div className="mt-1 text-xs text-slate-500">
                        ระยะเวลาฝากเลี้ยง: 🗓️ {dateStr} เวลา {timeStr} น. ถึง {new Date(b.checkOutDateTime).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })} เวลา {new Date(b.checkOutDateTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น. ({b.days} วัน)
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-500">
                        เวลานัดหมาย: 🗓️ {dateStr} เวลา {timeStr} น.
                      </div>
                    )}

                    {b.notes && (
                      <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600 italic">
                        ความต้องการพิเศษ: "{b.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 justify-between border-t border-slate-50 pt-3 md:border-0 md:pt-0">
                    <div className="text-right">
                      <span className="text-xs text-slate-500">ค่าบริการเริ่มต้น</span>
                      <p className="text-lg font-bold text-brand-600">{b.price} บาท</p>
                    </div>
                    <BookingActionsClient booking={b} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
