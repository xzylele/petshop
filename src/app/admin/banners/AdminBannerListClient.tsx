"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, X, Save, AlertCircle, Image as ImageIcon, Upload, Link as LinkIcon } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
}

export default function AdminBannerListClient({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สเตตสำหรับ Modal (สร้าง/แก้ไข)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = สร้างใหม่

  // ตัวเลือกแหล่งที่มาของภาพแบนเนอร์: "url" หรือ "file"
  const [imageSource, setImageSource] = useState<"url" | "file">("url");

  // สเตตฟอร์ม (ลบ title และ subtitle ออกตามดีไซน์รูปอย่างเดียว)
  const [form, setForm] = useState({
    imageUrl: "",
    linkUrl: "",
    order: 0
  });

  function openCreate() {
    setForm({
      imageUrl: "",
      linkUrl: "",
      order: banners.length > 0 ? Math.max(...banners.map((b) => b.order)) + 1 : 0
    });
    setEditingId(null);
    setImageSource("url");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(b: Banner) {
    setForm({
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      order: b.order
    });
    setEditingId(b.id);
    setImageSource(b.imageUrl.startsWith("/uploads/") ? "file" : "url");
    setError(null);
    setModalOpen(true);
  }

  // จัดการอัปโหลดไฟล์รูปภาพแบนเนอร์
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดล้มเหลว");
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("คุณแน่ใจว่าต้องการลบรูปภาพแบนเนอร์นี้หรือไม่?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "เกิดข้อผิดพลาดในการลบ");
      }
      setBanners((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!form.imageUrl.trim()) {
      setError("กรุณาระบุ URL หรืออัปโหลดไฟล์แบนเนอร์");
      setLoading(false);
      return;
    }

    // เซ็ตข้อมูล Title/Subtitle ส่งเป็นค่าว่างเพื่อให้ตรงกับ schema
    const payload = {
      title: "",
      subtitle: "",
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl,
      order: form.order
    };

    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/admin/banners/${editingId}` : "/api/admin/banners";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถจัดเก็บข้อมูลได้");
      }

      if (isEdit) {
        setBanners((prev) =>
          prev
            .map((b) => (b.id === editingId ? { ...b, ...payload } : b))
            .sort((x, y) => x.order - y.order)
        );
      } else {
        const newBanner = {
          id: data.banner.id,
          title: "",
          subtitle: "",
          imageUrl: data.banner.imageUrl,
          linkUrl: data.banner.linkUrl ?? "",
          order: data.banner.order
        };
        setBanners((prev) => [...prev, newBanner].sort((x, y) => x.order - y.order));
      }

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ปุ่มกดเพิ่มแบนเนอร์ */}
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="btn-primary py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold shadow-md shadow-brand-100"
        >
          <Plus className="w-4 h-4" /> เพิ่มแบนเนอร์ใหม่
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="card text-center p-12 bg-white border border-slate-100 rounded-2xl">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm mb-1">ยังไม่มีแบนเนอร์สไลด์</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            คุณยังไม่ได้สร้างแบนเนอร์สไลด์สำหรับแสดงในหน้าแรกของเว็บไซต์ในขณะนี้ กดปุ่ม "เพิ่มแบนเนอร์ใหม่" เพื่อเริ่มต้น
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="card overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="relative aspect-[16/7] bg-slate-50 overflow-hidden border-b border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imageUrl}
                  alt="Banner Slide"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute top-2 left-2 bg-slate-900/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  คิวลำดับ: {b.order}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-1 flex-1 text-xs">
                {b.linkUrl ? (
                  <p className="text-[10px] text-brand-600 truncate font-semibold">
                    🔗 ลิงก์รูปภาพ: {b.linkUrl}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">ไม่ได้กำหนดลิงก์ปลายทาง</p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-2 text-xs font-semibold">
                <button
                  onClick={() => openEdit(b)}
                  className="px-2.5 py-1.5 text-slate-650 hover:text-slate-800 hover:bg-slate-100/50 rounded-lg flex items-center gap-1 transition"
                >
                  <Edit className="w-3.5 h-3.5" /> แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={loading}
                  className="px-2.5 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50/50 rounded-lg flex items-center gap-1 transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog ฟอร์มสร้าง/แก้ไขแบนเนอร์ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? "✏️ แก้ไขรูปภาพแบนเนอร์" : "🖼️ เพิ่มรูปภาพแบนเนอร์ใหม่"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-450 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* เลือกรูปแบบที่มาของภาพแบนเนอร์ */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">เลือกแหล่งที่มาของรูปภาพแบนเนอร์</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImageSource("url")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      imageSource === "url"
                        ? "border-brand-500 bg-brand-50/20 text-brand-700"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" /> ลิงก์ URL รูปภาพ
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource("file")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      imageSource === "file"
                        ? "border-brand-500 bg-brand-50/20 text-brand-700"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Upload className="w-4 h-4" /> อัปโหลดไฟล์จากเครื่อง
                  </button>
                </div>
              </div>

              {/* ช่องกรอกตามชนิดที่เลือก */}
              {imageSource === "url" ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ลิงก์ URL รูปภาพ *</label>
                  <input
                    type="text"
                    required
                    placeholder="ป้อน URL รูปภาพแบนเนอร์ เช่น https://example.com/banner.jpg"
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อัปโหลดไฟล์รูปแบนเนอร์ *</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      required={!form.imageUrl}
                      onChange={handleFileUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 w-full text-slate-500"
                    />
                    {uploading && (
                      <span className="text-[10px] text-brand-650 font-bold block mt-1 animate-pulse">
                        กำลังอัปโหลดไฟล์เข้าเครื่อง...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Live */}
              {form.imageUrl && (
                <div className="rounded-xl border border-dashed border-slate-200 p-2 bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">พรีวิวรูปภาพแบนเนอร์:</span>
                  <div className="aspect-[16/7] rounded-lg overflow-hidden border border-slate-100 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ลิงก์ภาพกดไปยังปลายทาง (Link URL)</label>
                  <input
                    type="text"
                    placeholder="เช่น /products หรือ /shops/xxx (ไม่บังคับ)"
                    value={form.linkUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ลำดับการแสดงผล (Order)</label>
                  <input
                    type="number"
                    required
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className="input w-full rounded-xl border-slate-200 text-center"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-semibold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-slate-650 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-4 py-2.5 text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
