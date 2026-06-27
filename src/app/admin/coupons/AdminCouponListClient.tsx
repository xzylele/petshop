"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, X, Save, AlertCircle, Ticket, Calendar, Check, Ban } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  endDate: string;
  isActive: boolean;
  allowedCategory?: "ALL" | "PRODUCT" | "ANIMAL" | "SERVICE";
}

export default function AdminCouponListClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สเตตสำหรับ Modal (สร้าง/แก้ไข)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = สร้างใหม่

  // สเตตฟอร์ม
  const [form, setForm] = useState({
    code: "",
    discountType: "FIXED" as "FIXED" | "PERCENTAGE",
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: "" as string | number,
    endDate: "",
    isActive: true,
    allowedCategory: "ALL" as "ALL" | "PRODUCT" | "ANIMAL" | "SERVICE"
  });

  function openCreate() {
    // กำหนดวันหมดอายุเป็นวันพรุ่งนี้ตอนเช้าโดยค่าเริ่มต้น
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateStr = tomorrow.toISOString().split("T")[0];

    setForm({
      code: "",
      discountType: "FIXED",
      discountValue: 50,
      minPurchase: 300,
      maxDiscount: "",
      endDate: dateStr,
      isActive: true,
      allowedCategory: "ALL"
    });
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: Coupon) {
    setForm({
      code: c.code,
      discountType: c.discountType as "FIXED" | "PERCENTAGE",
      discountValue: c.discountValue,
      minPurchase: c.minPurchase,
      maxDiscount: c.maxDiscount ?? "",
      endDate: c.endDate.split("T")[0],
      isActive: c.isActive,
      allowedCategory: c.allowedCategory || "ALL"
    });
    setEditingId(c.id);
    setError(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("คุณแน่ใจว่าต้องการลบคูปองส่วนลดนี้หรือไม่?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "เกิดข้อผิดพลาดในการลบ");
      }
      setCoupons((prev) => prev.filter((c) => c.id !== id));
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

    if (!form.code.trim()) {
      setError("กรุณากรอกโค้ดคูปอง");
      setLoading(false);
      return;
    }
    if (form.discountValue <= 0) {
      setError("มูลค่าส่วนลดต้องมากกว่า 0");
      setLoading(false);
      return;
    }
    if (!form.endDate) {
      setError("กรุณากำหนดวันหมดอายุคูปอง");
      setLoading(false);
      return;
    }

    const payload = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minPurchase: Number(form.minPurchase),
      maxDiscount: form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
      endDate: new Date(form.endDate).toISOString(),
      isActive: form.isActive,
      allowedCategory: form.allowedCategory
    };

    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
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
        setCoupons((prev) =>
          prev
            .map((c) => (c.id === editingId ? { ...c, ...payload } : c))
            .sort((x, y) => new Date(y.endDate).getTime() - new Date(x.endDate).getTime())
        );
      } else {
        const newCoupon = {
          id: data.coupon.id,
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          minPurchase: data.coupon.minPurchase,
          maxDiscount: data.coupon.maxDiscount,
          endDate: data.coupon.endDate,
          isActive: data.coupon.isActive,
          allowedCategory: data.coupon.allowedCategory
        };
        setCoupons((prev) => [newCoupon, ...prev]);
      }

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ฟังก์ชันคำนวณสถานะคูปอง
  function getCouponBadge(c: Coupon) {
    const isExpired = new Date(c.endDate) < new Date();
    if (!c.isActive) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-650 text-[10px] font-bold px-2 py-0.5">
          <Ban className="w-3 h-3" /> ปิดใช้งาน
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 border border-rose-100">
          <Calendar className="w-3 h-3" /> หมดอายุ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-650 text-[10px] font-bold px-2 py-0.5 border border-emerald-150">
        <Check className="w-3 h-3" /> ใช้งานอยู่
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* ปุ่มกดสร้างคูปองกลาง */}
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="btn-primary py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold shadow-md shadow-brand-100"
        >
          <Plus className="w-4 h-4" /> สร้างคูปองส่วนลดกลาง
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="card text-center p-12 bg-white border border-slate-100 rounded-2xl">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm mb-1">ยังไม่มีคูปองส่วนลดกลาง</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            แพลตฟอร์มยังไม่มีคูปองส่วนลดส่วนกลางในระบบขณะนี้ กดปุ่ม "สร้างคูปองส่วนลดกลาง" เพื่อออกสิทธิประโยชน์ให้ลูกค้า
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {coupons.map((c) => {
            const isPercentage = c.discountType === "PERCENTAGE";
            return (
              <div
                key={c.id}
                className="card overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                {/* Header Ticket Design */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-650 p-4 text-white relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50" />

                  <div className="pl-4 pr-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-brand-100 uppercase tracking-widest font-black block">รหัสโค้ดคูปอง</span>
                      <span className="text-lg font-black tracking-wider block font-mono">{c.code}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-brand-100 uppercase block">ส่วนลด</span>
                      <span className="text-xl font-black block">
                        {isPercentage ? `${c.discountValue}%` : `${c.discountValue}.-`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-4 space-y-2 text-xs flex-1">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-450 font-bold text-[10px]">สถานะคูปอง</span>
                    {getCouponBadge(c)}
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <p className="flex justify-between">
                      <span className="text-slate-450">ขั้นต่ำในการซื้อ:</span>
                      <span className="font-bold">{c.minPurchase} บาท</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-450">หมวดหมู่ร่วมรายการ:</span>
                      <span className="font-bold text-brand-600">
                        {c.allowedCategory === "PRODUCT" && "สินค้าเท่านั้น"}
                        {c.allowedCategory === "ANIMAL" && "สัตว์เลี้ยงเท่านั้น"}
                        {c.allowedCategory === "SERVICE" && "บริการจองคิวเท่านั้น"}
                        {(c.allowedCategory === "ALL" || !c.allowedCategory) && "ทั้งหมด"}
                      </span>
                    </p>
                    {isPercentage && c.maxDiscount && (
                      <p className="flex justify-between">
                        <span className="text-slate-450">ลดสูงสุด:</span>
                        <span className="font-bold text-rose-600">{c.maxDiscount} บาท</span>
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span className="text-slate-450">วันหมดอายุ:</span>
                      <span className="font-bold">{new Date(c.endDate).toLocaleDateString("th-TH")}</span>
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-2 text-xs font-semibold">
                  <button
                    onClick={() => openEdit(c)}
                    className="px-2.5 py-1.5 text-slate-650 hover:text-slate-800 hover:bg-slate-100/50 rounded-lg flex items-center gap-1 transition"
                  >
                    <Edit className="w-3.5 h-3.5" /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={loading}
                    className="px-2.5 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50/50 rounded-lg flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog ฟอร์มสร้าง/แก้ไขคูปอง */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? "✏️ แก้ไขข้อมูลคูปองส่วนลด" : "🎟️ ออกคูปองส่วนลดกลางของระบบ"}
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสโค้ดคูปอง *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น HELLO2026, ADMIN50 (จะบันทึกเป็นตัวพิมพ์ใหญ่)"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="input w-full rounded-xl border-slate-200 uppercase font-mono tracking-wider font-bold"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ประเภทส่วนลด *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discountType: e.target.value as "FIXED" | "PERCENTAGE"
                      }))
                    }
                    className="input w-full rounded-xl border-slate-200 bg-white"
                  >
                    <option value="FIXED">หักจำนวนเงิน (บาท)</option>
                    <option value="PERCENTAGE">หักเป็นเปอร์เซ็นต์ (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">มูลค่าส่วนลด *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))}
                    className="input w-full rounded-xl border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ยอดซื้อขั้นต่ำ (บาท)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minPurchase}
                    onChange={(e) => setForm((f) => ({ ...f, minPurchase: Number(e.target.value) }))}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ส่วนลดสูงสุด (บาท)
                    {form.discountType !== "PERCENTAGE" && <span className="text-slate-400 font-normal"> (เฉพาะ %)</span>}
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={form.discountType !== "PERCENTAGE"}
                    placeholder="ปล่อยว่างหากลดไม่จำกัด"
                    value={form.maxDiscount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxDiscount: e.target.value !== "" ? Number(e.target.value) : ""
                      }))
                    }
                    className="input w-full rounded-xl border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วันหมดอายุ *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">หมวดหมู่ร่วมรายการ *</label>
                  <select
                    value={form.allowedCategory}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        allowedCategory: e.target.value as any
                      }))
                    }
                    className="input w-full rounded-xl border-slate-200 bg-white"
                  >
                    <option value="ALL">ลดทั้งหมด (สินค้า/สัตว์/บริการ)</option>
                    <option value="PRODUCT">ลดเฉพาะสินค้าเท่านั้น</option>
                    <option value="ANIMAL">ลดเฉพาะสัตว์เลี้ยงเท่านั้น</option>
                    <option value="SERVICE">ลดเฉพาะบริการจองคิวเท่านั้น</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5"
                  />
                  <span>เปิดใช้งานคูปองนี้ทันที</span>
                </label>
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
                  disabled={loading}
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
