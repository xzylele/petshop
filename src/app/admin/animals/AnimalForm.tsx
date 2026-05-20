"use client";

// ฟอร์มเพิ่ม/แก้ไขสัตว์เลี้ยงฝั่งแอดมิน

import { useRouter } from "next/navigation";
import { useState } from "react";

const ANIMAL_TYPES = ["สุนัข", "แมว", "นก", "ปลา", "กระต่าย", "สัตว์เลื้อยคลาน", "สัตว์แปลก"];

type Farm = { id: string; name: string };
type Initial = {
  id?: string;
  name: string;
  animalType: string;
  breed: string;
  gender: string;
  price: number;
  description: string;
  imageUrl: string;
  isExotic: boolean;
  farmId: string;
  status: string;
};

export default function AnimalForm({ farms, initial }: { farms: Farm[]; initial?: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial ?? {
    name: "", animalType: ANIMAL_TYPES[0], breed: "", gender: "", price: 0, description: "", imageUrl: "", isExotic: false, farmId: "", status: "ACTIVE"
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function up<K extends keyof Initial>(k: K, v: Initial[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ส่งข้อมูลสร้าง/แก้ไขสัตว์ไปยัง API
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const url = initial?.id ? `/api/admin/animals/${initial.id}` : "/api/admin/animals";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    router.push("/admin/animals");
    router.refresh();
  }

  // ลบสัตว์จากระบบ
  async function remove() {
    if (!initial?.id || !confirm("ลบสัตว์นี้?")) return;
    await fetch(`/api/admin/animals/${initial.id}`, { method: "DELETE" });
    router.push("/admin/animals");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">ชื่อ</label>
          <input className="input" value={form.name} onChange={(e) => up("name", e.target.value)} />
        </div>
        <div>
          <label className="label">ประเภทสัตว์ *</label>
          <select className="input" value={form.animalType} onChange={(e) => up("animalType", e.target.value)}>
            {ANIMAL_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">สายพันธุ์</label>
          <input className="input" value={form.breed} onChange={(e) => up("breed", e.target.value)} />
        </div>
        <div>
          <label className="label">เพศ</label>
          <select className="input" value={form.gender} onChange={(e) => up("gender", e.target.value)}>
            <option value="">—</option>
            <option value="ผู้">ผู้</option>
            <option value="เมีย">เมีย</option>
          </select>
        </div>
        <div>
          <label className="label">ราคา *</label>
          <input type="number" min={0} required className="input" value={form.price} onChange={(e) => up("price", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">ฟาร์ม</label>
          <select className="input" value={form.farmId} onChange={(e) => up("farmId", e.target.value)}>
            <option value="">— ไม่ระบุฟาร์ม —</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">คำอธิบาย</label>
        <textarea rows={3} className="input" value={form.description} onChange={(e) => up("description", e.target.value)} />
      </div>
      <div>
        <label className="label">URL รูป</label>
        <input className="input" value={form.imageUrl} onChange={(e) => up("imageUrl", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isExotic} onChange={(e) => up("isExotic", e.target.checked)} />
          เป็นสัตว์แปลก (ต้องตรวจสอบเอกสารเพิ่มเติม)
        </label>
        <div>
          <label className="label">สถานะ</label>
          <select className="input" value={form.status} onChange={(e) => up("status", e.target.value)}>
            <option value="ACTIVE">เปิดขาย</option>
            <option value="RESERVED">จองแล้ว</option>
            <option value="SOLD">ขายแล้ว</option>
            <option value="HIDDEN">ซ่อน</option>
          </select>
        </div>
      </div>

      {msg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}

      <div className="flex gap-2">
        <button disabled={loading} className="btn-primary">{loading ? "กำลังบันทึก..." : "บันทึก"}</button>
        {initial?.id && <button type="button" onClick={remove} className="btn-outline border-red-300 text-red-600 hover:bg-red-50">ลบ</button>}
      </div>
    </form>
  );
}
