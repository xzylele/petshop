"use client";

// ฟอร์มเพิ่ม/แก้ไขฟาร์มฝั่งแอดมิน

import { useRouter } from "next/navigation";
import { useState } from "react";

type Initial = {
  id?: string;
  name: string;
  description: string;
  address: string;
  province: string;
  district: string;
  subDistrict: string;
  phone: string;
  latitude: number | "";
  longitude: number | "";
  coverImageUrl: string;
  animalTypes: string;
  status: string;
};

export default function FarmForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial ?? {
    name: "", description: "", address: "", province: "", district: "", subDistrict: "", phone: "",
    latitude: "", longitude: "", coverImageUrl: "", animalTypes: "", status: "ACTIVE"
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function up<K extends keyof Initial>(k: K, v: Initial[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ส่งข้อมูลสร้าง/แก้ไขฟาร์มไปยัง API
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const url = initial?.id ? `/api/admin/farms/${initial.id}` : "/api/admin/farms";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    router.push("/admin/farms");
    router.refresh();
  }

  // ลบฟาร์มออกจากระบบ
  async function remove() {
    if (!initial?.id || !confirm("ลบฟาร์มนี้?")) return;
    await fetch(`/api/admin/farms/${initial.id}`, { method: "DELETE" });
    router.push("/admin/farms");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">ชื่อฟาร์ม *</label>
        <input required className="input" value={form.name} onChange={(e) => up("name", e.target.value)} />
      </div>
      <div>
        <label className="label">คำอธิบาย</label>
        <textarea rows={3} className="input" value={form.description} onChange={(e) => up("description", e.target.value)} />
      </div>
      <div>
        <label className="label">ที่อยู่ *</label>
        <input required className="input" value={form.address} onChange={(e) => up("address", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div><label className="label">จังหวัด</label><input className="input" value={form.province} onChange={(e) => up("province", e.target.value)} /></div>
        <div><label className="label">อำเภอ</label><input className="input" value={form.district} onChange={(e) => up("district", e.target.value)} /></div>
        <div><label className="label">ตำบล</label><input className="input" value={form.subDistrict} onChange={(e) => up("subDistrict", e.target.value)} /></div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div><label className="label">เบอร์โทร</label><input className="input" value={form.phone} onChange={(e) => up("phone", e.target.value)} /></div>
        <div><label className="label">Latitude</label><input type="number" step="0.0001" className="input" value={form.latitude} onChange={(e) => up("latitude", e.target.value === "" ? "" : Number(e.target.value))} /></div>
        <div><label className="label">Longitude</label><input type="number" step="0.0001" className="input" value={form.longitude} onChange={(e) => up("longitude", e.target.value === "" ? "" : Number(e.target.value))} /></div>
      </div>
      <div>
        <label className="label">URL รูปปก</label>
        <input className="input" value={form.coverImageUrl} onChange={(e) => up("coverImageUrl", e.target.value)} />
      </div>
      <div>
        <label className="label">ประเภทสัตว์ที่เพาะพันธุ์ (คั่นด้วยจุลภาค)</label>
        <input className="input" placeholder="สุนัข, แมว, กระต่าย" value={form.animalTypes} onChange={(e) => up("animalTypes", e.target.value)} />
      </div>
      <div>
        <label className="label">สถานะ</label>
        <select className="input" value={form.status} onChange={(e) => up("status", e.target.value)}>
          <option value="ACTIVE">แสดง</option>
          <option value="HIDDEN">ซ่อน</option>
          <option value="PENDING">รอตรวจสอบ</option>
        </select>
      </div>

      {msg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}

      <div className="flex gap-2">
        <button disabled={loading} className="btn-primary">{loading ? "กำลังบันทึก..." : "บันทึก"}</button>
        {initial?.id && <button type="button" onClick={remove} className="btn-outline border-red-300 text-red-600 hover:bg-red-50">ลบ</button>}
      </div>
    </form>
  );
}
