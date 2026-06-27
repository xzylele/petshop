"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit3, X, Save, AlertCircle, Upload } from "lucide-react";

export default function ShopActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สเตตข้อมูลร้านค้าสำหรับการแก้ไขโดยแอดมิน
  const [form, setForm] = useState({
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
  });

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

  // เรียก API เพื่อดึงข้อมูลร้านขึ้นมาแก้ไข
  async function handleOpenEdit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shops/${id}`);
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลร้านค้าได้");
      const data = await res.json();
      const s = data.shop;
      setForm({
        name: s.name || "",
        description: s.description || "",
        phone: s.phone || "",
        address: s.address || "",
        province: s.province || "",
        coverUrl: s.coverUrl || "",
        logoUrl: s.logoUrl || "",
        allowsGrooming: s.allowsGrooming || false,
        allowsBoarding: s.allowsBoarding || false,
        boardingCapacity: s.boardingCapacity ?? 5,
        boardingPrice: s.boardingPrice ?? 500,
        groomingPriceSmall: s.groomingPriceSmall ?? 350,
        groomingPriceMedium: s.groomingPriceMedium ?? 500,
        groomingPriceLarge: s.groomingPriceLarge ?? 650,
        spaPriceSmall: s.spaPriceSmall ?? 450,
        spaPriceMedium: s.spaPriceMedium ?? 600,
        spaPriceLarge: s.spaPriceLarge ?? 750
      });
      setEditOpen(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  // เรียก API เพื่อเปลี่ยนสถานะร้าน
  async function act(action: "approve" | "reject" | "suspend") {
    setBusy(true);
    await fetch(`/api/admin/shops/${id}/${action}`, { method: "PUT" });
    setBusy(false);
    router.refresh();
  }

  // อัปเดตการแก้ไขร้านค้า
  async function handleSaveShop(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อร้านค้า");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/shops/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");

      setEditOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex justify-end gap-2 items-center">
      {/* ปุ่มเปิดแก้ไขข้อมูลร้านค้า */}
      <button
        disabled={busy}
        onClick={handleOpenEdit}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition flex items-center gap-1"
      >
        <Edit3 className="w-3.5 h-3.5" /> แก้ไขร้าน
      </button>

      {status !== "APPROVED" && (
        <button disabled={busy} onClick={() => act("approve")} className="btn-secondary text-xs">
          อนุมัติ
        </button>
      )}
      {status !== "REJECTED" && (
        <button disabled={busy} onClick={() => act("reject")} className="btn-outline text-xs">
          ปฏิเสธ
        </button>
      )}
      {status !== "SUSPENDED" && (
        <button
          disabled={busy}
          onClick={() => act("suspend")}
          className="btn-outline text-xs text-red-600 border-red-300"
        >
          ระงับ
        </button>
      )}

      {/* Modal หน้าจอแก้ไขข้อมูลร้านค้าสำหรับแอดมิน */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 text-left">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">✏️ แก้ไขรายละเอียดร้านค้า (โหมดผู้ดูแลระบบ)</h3>
              <button
                onClick={() => setEditOpen(false)}
                className="text-slate-450 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSaveShop} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อร้านค้า *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => up("name", e.target.value)}
                  className="input w-full rounded-xl border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">คำอธิบายร้านค้า</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => up("description", e.target.value)}
                  className="input w-full rounded-xl border-slate-200"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => up("phone", e.target.value)}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จังหวัด</label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => up("province", e.target.value)}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ที่อยู่ร้านค้า</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => up("address", e.target.value)}
                  className="input w-full rounded-xl border-slate-200"
                />
              </div>

               <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">แบนเนอร์ร้านค้า (Cover Banner)</label>
                  <div className="flex gap-2">
                    <input className="input w-full" placeholder="ใส่ URL แบนเนอร์ หรืออัปโหลดไฟล์ภาพ" value={form.coverUrl} onChange={(e) => up("coverUrl", e.target.value)} />
                    <label className="cursor-pointer shrink-0 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-2 text-[10px] font-bold flex items-center gap-1 text-slate-700 transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{uploadingField === "coverUrl" ? "..." : "อัปโหลด"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "coverUrl")} disabled={uploadingField !== null} />
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">โลโก้ร้านค้า (Shop Logo)</label>
                  <div className="flex gap-2">
                    <input className="input w-full" placeholder="ใส่ URL โลโก้ หรืออัปโหลดไฟล์ภาพ" value={form.logoUrl} onChange={(e) => up("logoUrl", e.target.value)} />
                    <label className="cursor-pointer shrink-0 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-2 text-[10px] font-bold flex items-center gap-1 text-slate-700 transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{uploadingField === "logoUrl" ? "..." : "อัปโหลด"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "logoUrl")} disabled={uploadingField !== null} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview Live รูปภาพแบนเนอร์และโลโก้ */}
              {(form.coverUrl.startsWith("http") || form.logoUrl.startsWith("http")) && (
                <div className="rounded-xl border border-dashed border-slate-200 p-3 bg-slate-50/50 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold block">พรีวิวรูปภาพหน้าร้าน:</span>
                  <div className="relative aspect-[16/6] rounded-lg overflow-hidden border border-slate-100 bg-white">
                    {form.coverUrl.startsWith("http") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    )}
                    {form.logoUrl.startsWith("http") && (
                      <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full border border-white overflow-hidden shadow-sm bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ตั้งค่าบริการ */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="block font-bold text-slate-700">ตั้งค่าบริการและราคาของร้านค้า</span>

                <div className="space-y-3">
                  {/* Grooming */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowsGrooming}
                        onChange={(e) => up("allowsGrooming", e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                      <span>✂️ บริการอาบน้ำตัดขน / สปาสัตว์เลี้ยง (Grooming & Spa)</span>
                    </label>

                    {form.allowsGrooming && (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2 ml-6">
                        <span className="text-[10px] font-bold text-slate-450 block">ราคาอาบน้ำตัดขน (เล็ก/กลาง/ใหญ่)</span>
                        <div className="grid gap-2 grid-cols-3">
                          <input
                            type="number"
                            placeholder="เล็ก"
                            value={form.groomingPriceSmall}
                            onChange={(e) => up("groomingPriceSmall", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                          <input
                            type="number"
                            placeholder="กลาง"
                            value={form.groomingPriceMedium}
                            onChange={(e) => up("groomingPriceMedium", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                          <input
                            type="number"
                            placeholder="ใหญ่"
                            value={form.groomingPriceLarge}
                            onChange={(e) => up("groomingPriceLarge", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-455 block pt-1">ราคาสปาสัตว์เลี้ยง (เล็ก/กลาง/ใหญ่)</span>
                        <div className="grid gap-2 grid-cols-3">
                          <input
                            type="number"
                            placeholder="เล็ก"
                            value={form.spaPriceSmall}
                            onChange={(e) => up("spaPriceSmall", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                          <input
                            type="number"
                            placeholder="กลาง"
                            value={form.spaPriceMedium}
                            onChange={(e) => up("spaPriceMedium", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                          <input
                            type="number"
                            placeholder="ใหญ่"
                            value={form.spaPriceLarge}
                            onChange={(e) => up("spaPriceLarge", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Boarding */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowsBoarding}
                        onChange={(e) => up("allowsBoarding", e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                      <span>🏨 บริการรับฝากเลี้ยงสัตว์เลี้ยง (Pet Hotel)</span>
                    </label>

                    {form.allowsBoarding && (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 grid gap-3 grid-cols-2 ml-6">
                        <div>
                          <span className="text-[10px] font-bold text-slate-450 block mb-1">ความจุห้องฝากเลี้ยง</span>
                          <input
                            type="number"
                            value={form.boardingCapacity}
                            onChange={(e) => up("boardingCapacity", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-450 block mb-1">ราคาฝากต่อวัน (บาท)</span>
                          <input
                            type="number"
                            value={form.boardingPrice}
                            onChange={(e) => up("boardingPrice", Number(e.target.value))}
                            className="input text-center font-bold bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-semibold">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2.5 text-slate-650 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2.5 text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
