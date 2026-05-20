"use client";

// ปุ่มยืนยัน/ปฏิเสธการชำระเงิน

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // เรียก API เพื่อเปลี่ยนสถานะการชำระเงิน
  async function act(action: "verify" | "reject") {
    setBusy(true);
    await fetch(`/api/admin/payments/${id}/${action}`, { method: "PUT" });
    setBusy(false);
    router.refresh();
  }

  if (status === "VERIFIED") return <span className="badge bg-emerald-100 text-emerald-700">อนุมัติแล้ว</span>;
  if (status === "REFUNDED") return <span className="badge bg-slate-200 text-slate-700">คืนเงินแล้ว</span>;

  return (
    <>
      <button disabled={busy} onClick={() => act("verify")} className="btn-primary text-xs">✓ อนุมัติ</button>
      <button disabled={busy} onClick={() => act("reject")} className="btn-outline text-xs border-red-300 text-red-600">✗ ปฏิเสธ</button>
    </>
  );
}
