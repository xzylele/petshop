"use client";

// ฟอร์มสร้างคำสั่งซื้อและวิธีชำระเงิน

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    address: "",
    note: "",
    method: "QR_CODE" as "QR_CODE" | "BANK_TRANSFER"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ส่งข้อมูลไปสร้างคำสั่งซื้อ แล้วพาไปหน้ารายละเอียดออเดอร์
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "สร้างคำสั่งซื้อไม่สำเร็จ");
      return;
    }
    router.push(`/orders/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">ที่อยู่จัดส่ง</label>
        <textarea
          required
          rows={3}
          className="input"
          placeholder="ที่อยู่เต็ม รวมจังหวัด อำเภอ และรหัสไปรษณีย์"
          value={form.address}
          onChange={(e) => up("address", e.target.value)}
        />
      </div>

      <div>
        <label className="label">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
        <textarea rows={2} className="input" value={form.note} onChange={(e) => up("note", e.target.value)} />
      </div>

      <div>
        <label className="label">วิธีชำระเงิน</label>
        <div className="grid gap-2 md:grid-cols-2">
          <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${form.method === "QR_CODE" ? "border-brand-500 bg-brand-50" : "border-slate-300"}`}>
            <input type="radio" name="method" checked={form.method === "QR_CODE"} onChange={() => up("method", "QR_CODE")} />
            <span><span className="text-2xl">📱</span> QR PromptPay</span>
          </label>
          <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${form.method === "BANK_TRANSFER" ? "border-brand-500 bg-brand-50" : "border-slate-300"}`}>
            <input type="radio" name="method" checked={form.method === "BANK_TRANSFER"} onChange={() => up("method", "BANK_TRANSFER")} />
            <span><span className="text-2xl">🏦</span> โอนเข้าบัญชีธนาคาร</span>
          </label>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "กำลังสร้างคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
      </button>
    </form>
  );
}
