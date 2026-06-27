"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";

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
  boardingCapacity: number;
  boardingPrice: number;
  groomingPriceSmall: number;
  groomingPriceMedium: number;
  groomingPriceLarge: number;
  spaPriceSmall: number;
  spaPriceMedium: number;
  spaPriceLarge: number;
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
      allowsBoarding: false,
      boardingCapacity: 5,
      boardingPrice: 500,
      groomingPriceSmall: 350,
      groomingPriceMedium: 500,
      groomingPriceLarge: 650,
      spaPriceSmall: 450,
      spaPriceMedium: 600,
      spaPriceLarge: 750
    }
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, fieldName: "coverUrl" | "logoUrl") {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดรูปภาพล้มเหลว");
      up(fieldName, data.url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingField(null);
    }
  }

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
    <form onSubmit={submit} className="card space-y-5 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">ชื่อร้าน *</label>
        <input required className="input" value={form.name} onChange={(e) => up("name", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">คำอธิบายร้าน</label>
        <textarea rows={3} className="input" value={form.description} onChange={(e) => up("description", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">เบอร์โทรร้าน</label>
          <input className="input" value={form.phone} onChange={(e) => up("phone", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">จังหวัด</label>
          <input className="input" value={form.province} onChange={(e) => up("province", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">ที่อยู่ร้าน</label>
        <input className="input" value={form.address} onChange={(e) => up("address", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">แบนเนอร์หน้าร้าน (Cover Banner)</label>
          <div className="flex gap-2">
            <input className="input w-full" placeholder="ใส่ URL แบนเนอร์ หรืออัปโหลดไฟล์ภาพ" value={form.coverUrl} onChange={(e) => up("coverUrl", e.target.value)} />
            <label className="cursor-pointer shrink-0 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 text-slate-750 transition">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{uploadingField === "coverUrl" ? "กำลังอัปโหลด..." : "อัปโหลดภาพ"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "coverUrl")} disabled={uploadingField !== null} />
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">โลโก้ร้านค้า (Shop Logo)</label>
          <div className="flex gap-2">
            <input className="input w-full" placeholder="ใส่ URL โลโก้ หรืออัปโหลดไฟล์ภาพ" value={form.logoUrl} onChange={(e) => up("logoUrl", e.target.value)} />
            <label className="cursor-pointer shrink-0 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 text-slate-750 transition">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{uploadingField === "logoUrl" ? "กำลังอัปโหลด..." : "อัปโหลดภาพ"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "logoUrl")} disabled={uploadingField !== null} />
            </label>
          </div>
        </div>
      </div>

      {/* Live Preview หน้าร้านของตัวเอง */}
      {(form.coverUrl.startsWith("http") || form.logoUrl.startsWith("http")) && (
        <div className="rounded-xl border border-dashed border-slate-200 p-3 bg-slate-50/50 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold block">พรีวิวรูปภาพแบนเนอร์และโลโก้ร้าน:</span>
          <div className="relative aspect-[16/5] rounded-xl overflow-hidden border border-slate-100 bg-white">
            {form.coverUrl.startsWith("http") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
            )}
            {form.logoUrl.startsWith("http") && (
              <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* เลือกบริการที่เปิดจอง */}
      <div className="border-t border-slate-100 pt-4 space-y-4">
        <label className="block text-xs font-bold text-slate-700 uppercase">บริการของร้านที่เปิดรับจองคิว</label>
        <div className="space-y-4">
          {/* ส่วน Grooming & Spa */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={form.allowsGrooming}
                onChange={(e) => up("allowsGrooming", e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>✂️ บริการอาบน้ำตัดขน / สปาสัตว์เลี้ยง (Grooming & Spa)</span>
            </label>

            {form.allowsGrooming && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3 ml-6 animate-in fade-in duration-200">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">กำหนดราคา อาบน้ำตัดขน (ตามน้ำหนักสัตว์เลี้ยง)</div>
                <div className="grid gap-3 grid-cols-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">สัตว์เล็ก (≤ 5 กก.)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.groomingPriceSmall}
                      onChange={(e) => up("groomingPriceSmall", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">สัตว์กลาง (5.1 - 15 กก.)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.groomingPriceMedium}
                      onChange={(e) => up("groomingPriceMedium", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">{"สัตว์ใหญ่ (> 15 กก.)"}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.groomingPriceLarge}
                      onChange={(e) => up("groomingPriceLarge", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold"
                    />
                  </div>
                </div>

                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider pt-2">กำหนดราคา สปาสัตว์เลี้ยง (ตามน้ำหนักสัตว์เลี้ยง)</div>
                <div className="grid gap-3 grid-cols-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">สัตว์เล็ก (≤ 5 กก.)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.spaPriceSmall}
                      onChange={(e) => up("spaPriceSmall", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">สัตว์กลาง (5.1 - 15 กก.)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.spaPriceMedium}
                      onChange={(e) => up("spaPriceMedium", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">{"สัตว์ใหญ่ (> 15 กก.)"}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.spaPriceLarge}
                      onChange={(e) => up("spaPriceLarge", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ส่วน Pet Hotel */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={form.allowsBoarding}
                onChange={(e) => up("allowsBoarding", e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>🏨 บริการรับฝากเลี้ยงสัตว์เลี้ยง (Pet Hotel)</span>
            </label>

            {form.allowsBoarding && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3 ml-6 animate-in fade-in duration-200">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">ตั้งค่าความจุห้องพักและอัตราค่าฝากเลี้ยง</div>
                <div className="grid gap-3 grid-cols-2 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">จำนวนห้องว่างทั้งหมด (ความจุ)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.boardingCapacity}
                      onChange={(e) => up("boardingCapacity", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold text-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-650 mb-1">ราคาฝากเลี้ยงต่อวัน (บาท)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.boardingPrice}
                      onChange={(e) => up("boardingPrice", Number(e.target.value))}
                      className="input w-full bg-white rounded-lg border-slate-200 text-center font-bold text-brand-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {msg && <p className="rounded-xl bg-slate-100 border border-slate-150 px-4 py-3 text-xs font-semibold text-slate-700">{msg}</p>}

      <button disabled={loading} className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-sm font-semibold">
        {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
      </button>
    </form>
  );
}
