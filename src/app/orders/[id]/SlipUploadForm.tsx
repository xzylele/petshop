"use client";

// ฟอร์มอัปโหลดสลิปสำหรับคำสั่งซื้อ

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SlipUploadForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [slipUrl, setSlipUrl] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ส่ง URL สลิปไปยัง API ของการชำระเงิน
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/payments/${orderId}/slip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slipUrl, reference })
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "บันทึกสลิปไม่สำเร็จ");
      return;
    }
    setMsg("ส่งสลิปแล้ว รอแอดมินตรวจสอบ");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <div>
        <label className="label">URL รูปสลิป</label>
        <input className="input" type="url" required placeholder="https://..." value={slipUrl} onChange={(e) => setSlipUrl(e.target.value)} />
        <p className="mt-1 text-xs text-slate-500">ใน MVP นี้ใช้ลิงก์รูป กรุณาอัปโหลดผ่านบริการรูปและวาง URL ที่นี่</p>
      </div>
      <div>
        <label className="label">เลขอ้างอิงธุรกรรม (ถ้ามี)</label>
        <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <button disabled={loading} className="btn-primary w-full">{loading ? "กำลังส่ง..." : "ส่งสลิปให้ตรวจสอบ"}</button>
      {msg && <p className="text-xs text-slate-600">{msg}</p>}
    </form>
  );
}
