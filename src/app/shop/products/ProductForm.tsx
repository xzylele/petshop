"use client";

// ฟอร์มเพิ่ม/แก้ไขสินค้าในร้าน

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  "อาหารสัตว์",
  "ขนมสัตว์",
  "ของเล่น",
  "กรงและบ้าน",
  "ที่นอน",
  "อุปกรณ์ให้อาหารและน้ำ",
  "อุปกรณ์อาบน้ำและดูแลขน",
  "ยาและวิตามิน",
  "อุปกรณ์เดินเล่น",
  "อุปกรณ์ดูแลความสะอาดและทราย",
  "เสื้อผ้าและเครื่องประดับ",
  "อุปกรณ์สำหรับสัตว์แปลก"
];
const PET_TYPES = [
  "สุนัข",
  "แมว",
  "นก",
  "ปลา",
  "กระต่าย",
  "สัตว์เลื้อยคลาน",
  "สัตว์ฟันแทะ",
  "สัตว์แปลก"
];

type Initial = {
  id?: string;
  name: string;
  description: string;
  category: string;
  petType: string;
  price: number;
  stock: number;
  imageUrl: string;
  status: string;
};

export default function ProductForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial ?? {
    name: "", description: "", category: CATEGORIES[0], petType: "", price: 0, stock: 0, imageUrl: "", status: "ACTIVE"
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function up<K extends keyof Initial>(k: K, v: Initial[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ส่งข้อมูลสินค้าไปยัง API สำหรับสร้าง/แก้ไข
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const url = initial?.id ? `/api/shop/products/${initial.id}` : "/api/shop/products";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    router.push("/shop/products");
    router.refresh();
  }

  // ลบสินค้าออกจากร้าน
  async function remove() {
    if (!initial?.id) return;
    if (!confirm("ลบสินค้านี้?")) return;
    await fetch(`/api/shop/products/${initial.id}`, { method: "DELETE" });
    router.push("/shop/products");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">ชื่อสินค้า *</label>
        <input required className="input" value={form.name} onChange={(e) => up("name", e.target.value)} />
      </div>
      <div>
        <label className="label">คำอธิบาย</label>
        <textarea rows={3} className="input" value={form.description} onChange={(e) => up("description", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">หมวดหมู่</label>
          <select className="input" value={form.category} onChange={(e) => up("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">ประเภทสัตว์ที่เหมาะสม</label>
          <select className="input" value={form.petType} onChange={(e) => up("petType", e.target.value)}>
            <option value="">— เลือก —</option>
            {PET_TYPES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">ราคา (บาท) *</label>
          <input type="number" min={0} step="0.01" required className="input" value={form.price} onChange={(e) => up("price", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">สต็อก *</label>
          <input type="number" min={0} required className="input" value={form.stock} onChange={(e) => up("stock", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">สถานะ</label>
          <select className="input" value={form.status} onChange={(e) => up("status", e.target.value)}>
            <option value="ACTIVE">เปิดขาย</option>
            <option value="HIDDEN">ซ่อน</option>
            <option value="OUT_OF_STOCK">หมดสต็อก</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">URL รูปสินค้า</label>
        <input className="input" value={form.imageUrl} onChange={(e) => up("imageUrl", e.target.value)} placeholder="https://..." />
      </div>

      {msg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}

      <div className="flex gap-2">
        <button disabled={loading} className="btn-primary">{loading ? "กำลังบันทึก..." : "บันทึก"}</button>
        {initial?.id && <button type="button" onClick={remove} className="btn-outline border-red-300 text-red-600 hover:bg-red-50">ลบสินค้า</button>}
      </div>
    </form>
  );
}
