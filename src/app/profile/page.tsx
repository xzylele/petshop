import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import CancelBookingButton from "./CancelBookingButton";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "ลูกค้า",
  SHOP_OWNER: "เจ้าของร้านค้า",
  SHOP_STAFF: "พนักงานร้าน",
  ADMIN: "ผู้ดูแลระบบ"
};

// โหลดข้อมูลผู้ใช้ พร้อมข้อมูลที่อยู่และร้าน (ถ้ามี)
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: true,
      shop: true,
      bookings: {
        include: { shop: { select: { name: true, phone: true } } },
        orderBy: { dateTime: "desc" }
      }
    }
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">โปรไฟล์ของฉัน</h1>

      <div className="card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ชื่อ" value={user.name} />
          <Field label="อีเมล" value={user.email} />
          <Field label="เบอร์โทร" value={user.phone ?? "—"} />
          <Field label="บทบาท" value={ROLE_LABEL[user.role] ?? user.role} />
          <Field label="สถานะบัญชี" value={user.status} />
          <Field label="สมัครเมื่อ" value={formatDate(user.createdAt)} />
        </div>
      </div>

      {user.shop && (
        <div className="card mt-6 p-6">
          <h2 className="mb-2 text-lg font-semibold">ร้านของคุณ</h2>
          <Field label="ชื่อร้าน" value={user.shop.name} />
          <Field label="สถานะร้าน" value={user.shop.status} />
        </div>
      )}

      <div className="card mt-6 p-6">
        <h2 className="mb-2 text-lg font-semibold">ที่อยู่จัดส่ง</h2>
        {user.addresses.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีที่อยู่ที่บันทึกไว้</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {user.addresses.map((a) => (
              <li key={a.id} className="rounded border border-slate-200 p-3">
                <div className="font-medium">{a.name} {a.isDefault && <span className="badge bg-brand-100 text-brand-700">ค่าเริ่มต้น</span>}</div>
                <div>{a.phone}</div>
                <div>{a.addressLine} {a.subDistrict} {a.district} {a.province} {a.postalCode}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">รายการจองคิวบริการสัตว์เลี้ยง</h2>
        {user.bookings.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีประวัติการจองคิวบริการ</p>
        ) : (
          <div className="space-y-3">
            {user.bookings.map((b) => {
              const dateStr = new Date(b.dateTime).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const timeStr = new Date(b.dateTime).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={b.id} className="flex flex-col justify-between rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
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
                    <div className="mt-1 text-sm text-slate-600">
                      ร้าน: <strong>🏪 {b.shop.name}</strong> · เบอร์โทร: {b.shop.phone ?? "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      ชื่อสัตว์เลี้ยง: <strong>{b.petName}</strong> ({b.petType}){b.petWeight ? ` · น้ำหนัก: ${b.petWeight} กก.` : ""}
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
                      <div className="mt-1.5 rounded bg-slate-50 p-2 text-xs text-slate-500 italic">
                        ความต้องการพิเศษ: "{b.notes}"
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
                    <div className="text-right sm:block">
                      <div className="text-xs text-slate-500">ค่าบริการเริ่มต้น</div>
                      <div className="text-base font-bold text-brand-600">{b.price} บาท</div>
                    </div>
                    {b.status === "PENDING" && (
                      <CancelBookingButton bookingId={b.id} />
                    )}
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

// แถวแสดงข้อมูลแบบ label/value
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}
