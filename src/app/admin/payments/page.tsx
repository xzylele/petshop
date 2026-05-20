// หน้าแอดมินตรวจสอบการชำระเงิน
import { prisma } from "@/lib/prisma";
import { formatTHB, formatDate, PAYMENT_STATUS_LABEL } from "@/lib/utils";
import PaymentActions from "./PaymentActions";

export const dynamic = "force-dynamic";

// โหลดรายการชำระเงินพร้อมข้อมูลออเดอร์
export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { order: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">ตรวจสอบการชำระเงิน</h1>
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="card p-6 text-center text-slate-500">ยังไม่มีรายการการชำระเงิน</div>
        ) : payments.map((p) => (
          <div key={p.id} className="card grid gap-4 p-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-xs text-slate-500">Order #{p.order.id.slice(-8).toUpperCase()} · {formatDate(p.createdAt)}</div>
              <div className="text-sm">ลูกค้า: {p.order.user.name} ({p.order.user.email})</div>
              <div className="mt-1 text-sm">วิธี: {p.method} · ยอด: {formatTHB(p.amount)} · อ้างอิง: {p.reference ?? "—"}</div>
              <div className="mt-1">
                สถานะ: <span className="badge bg-slate-100 text-slate-800">{PAYMENT_STATUS_LABEL[p.status]}</span>
              </div>
              {p.slipUrl && (
                <a href={p.slipUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="slip" src={p.slipUrl} className="mt-3 max-h-40 rounded border border-slate-200" />
                </a>
              )}
            </div>
            <div className="flex md:flex-col items-start gap-2">
              <PaymentActions id={p.id} status={p.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
