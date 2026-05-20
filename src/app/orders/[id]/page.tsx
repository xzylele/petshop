// หน้ารายละเอียดคำสั่งซื้อ + สถานะการชำระเงิน
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB, formatDate, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/utils";
import SlipUploadForm from "./SlipUploadForm";

export const dynamic = "force-dynamic";

// โหลดข้อมูลคำสั่งซื้อและตรวจสิทธิ์เจ้าของออเดอร์
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true, user: true }
  });
  if (!order) notFound();
  if (order.userId !== session.user.id && session.user.role !== "ADMIN") notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">คำสั่งซื้อ #{order.id.slice(-8).toUpperCase()}</h1>
          <div className="text-sm text-slate-500">{formatDate(order.createdAt)}</div>
        </div>
        <span className="badge bg-brand-100 text-brand-700">{ORDER_STATUS_LABEL[order.status] ?? order.status}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <section className="card p-4">
            <h2 className="mb-3 font-semibold">รายการในคำสั่งซื้อ</h2>
            <ul className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{it.name} × {it.quantity}</span>
                  <span>{formatTHB(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold">
              <span>รวมทั้งสิ้น</span>
              <span className="text-brand-700">{formatTHB(order.total)}</span>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="mb-3 font-semibold">ที่อยู่จัดส่ง</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.address}</p>
            {order.note && (
              <>
                <h3 className="mt-3 text-sm font-semibold">หมายเหตุ</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.note}</p>
              </>
            )}
          </section>
        </div>

        <aside className="card h-fit p-4">
          <h2 className="mb-3 font-semibold">การชำระเงิน</h2>
          {order.payment ? (
            <>
              <div className="text-sm">
                <div>วิธี: {order.payment.method === "QR_CODE" ? "QR PromptPay" : "โอนบัญชี"}</div>
                <div>ยอด: {formatTHB(order.payment.amount)}</div>
                <div className="mt-1">
                  สถานะ: <span className="badge bg-slate-100 text-slate-800">{PAYMENT_STATUS_LABEL[order.payment.status] ?? order.payment.status}</span>
                </div>
              </div>

              {order.payment.status === "PENDING" && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {order.payment.method === "QR_CODE" ? (
                    <>
                      <p className="font-medium">กรุณาสแกน QR เพื่อชำระเงิน</p>
                      <div className="my-2 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="qr" src={`https://promptpay.io/0000000000/${order.total}.png`} className="h-40 w-40 rounded bg-white" />
                      </div>
                      <p>หรือโอนเข้า PromptPay: 000-000-0000</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">โอนเงินเข้าบัญชี</p>
                      <p>ธนาคาร: กสิกรไทย</p>
                      <p>เลขบัญชี: 123-4-56789-0</p>
                      <p>ชื่อบัญชี: PetsShop Co., Ltd.</p>
                    </>
                  )}
                </div>
              )}

              {(order.payment.status === "PENDING" || order.payment.status === "REJECTED") && (
                <div className="mt-4">
                  <SlipUploadForm orderId={order.id} />
                </div>
              )}

              {order.payment.slipUrl && (
                <div className="mt-4">
                  <div className="text-xs text-slate-500">สลิปที่อัปโหลด</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="slip" src={order.payment.slipUrl} className="mt-1 max-h-48 rounded border border-slate-200" />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">ไม่มีข้อมูลการชำระเงิน</p>
          )}
        </aside>
      </div>
    </div>
  );
}
