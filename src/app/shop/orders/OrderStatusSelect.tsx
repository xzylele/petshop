"use client";

// ตัวเลือกเปลี่ยนสถานะคำสั่งซื้อของร้าน

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["PAID", "PREPARING", "SHIPPED", "COMPLETED", "CANCELLED"];

export default function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // เรียก API เพื่ออัปเดตสถานะออเดอร์
  async function change(next: string) {
    setBusy(true);
    await fetch(`/api/shop/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <select
      disabled={busy}
      className="input w-44"
      value={status}
      onChange={(e) => change(e.target.value)}
    >
      <option value={status}>{status}</option>
      {STATUSES.filter((s) => s !== status).map((s) => <option key={s}>{s}</option>)}
    </select>
  );
}
