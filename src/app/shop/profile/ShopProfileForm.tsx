"use client";

// ฟอร์มบันทึกข้อมูลโปรไฟล์ร้านค้า

import { useRouter } from "next/navigation";
import { useState } from "react";

type Initial = { 
  name: string; 
  description: string; 
  phone: string; 
  address: string; 
  province: string; 
  coverUrl: string; 
  logoUrl: string;
  allowsGrooming: boolean;
  allowsBoarding: boolean;
} | null;

export default function ShopProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(
    initial ?? { 
      name: "", 
      description: "", 
      phone: "", 
      address: "", 
      province: "", 
      coverUrl: "", 
      logoUrl: "",
      allowsGrooming: false,
      allowsBoarding: false
    }
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ส่งข้อมูลไปยัง API /api/shop/profile
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/shop/profile", { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(form) 
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setMsg("บันทึกสำเร็จ");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">ชื่อร้าน *</label>
        <input required className="input" value={form.name} onChange={(e) => up("name", e.target.value)} />
      </div>
      <div>
        <label className="label">คำอธิบายร้าน</label>
        <textarea rows={3} className="input" value={form.description} onChange={(e) => up("description", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">เบอร์โทรร้าน</label>
          <input className="input" value={form.phone} onChange={(e) => up("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">จังหวัด</label>
          <input className="input" value={form.province} onChange={(e) => up("province", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">ที่อยู่ร้าน</label>
        <input className="input" value={form.address} onChange={(e) => up("address", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">URL รูปหน้าร้าน (cover)</label>
          <input className="input" value={form.coverUrl} onChange={(e) => up("coverUrl", e.target.value)} />
        </div>
        <div>
          <label className="label">URL โลโก้</label>
          <input className="input" value={form.logoUrl} onChange={(e) => up("logoUrl", e.target.value)} />
        </div>
      </div>

      {/* เลือกบริการที่เปิดจอง */}
      <div className="border-t border-slate-100 pt-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">บริการของร้านที่เปิดรับจองคิว</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowsGrooming}
              onChange={(e) => up("allowsGrooming", e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <span>✂️ บริการอาบน้ำตัดขน / สปาสัตว์เลี้ยง (Grooming & Spa)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowsBoarding}
              onChange={(e) => up("allowsBoarding", e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <span>🏨 บริการรับฝากเลี้ยงสัตว์เลี้ยง (Pet Hotel)</span>
          </label>
        </div>
      </div>

      {msg && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{msg}</p>}

      <button disabled={loading} className="btn-primary w-full sm:w-auto">{loading ? "กำลังบันทึก..." : "บันทึก"}</button>
    </form>
  );
}
