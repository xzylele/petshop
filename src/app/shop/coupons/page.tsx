"use client";

import { useState, useEffect } from "react";
import CouponForm from "./CouponForm";
import { formatTHB } from "@/lib/utils";
import { Plus, Edit2, Trash2, Tag, Calendar, AlertCircle } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export default function ShopCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/coupons");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }
      setCoupons(data.coupons || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("คุณต้องการลบคูปองส่วนลดนี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(`/api/shop/coupons/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ลบคูปองล้มเหลว");
      }
      fetchCoupons();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function handleFormSave() {
    setShowForm(false);
    setEditingCoupon(null);
    fetchCoupons();
  }

  function handleCancel() {
    setShowForm(false);
    setEditingCoupon(null);
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">คูปองส่วนลดของร้านค้า</h1>
          <p className="text-sm text-slate-500">สร้างและจัดการโค้ดส่วนลดเพื่อดึงดูดลูกค้า</p>
        </div>
        {!showForm && !editingCoupon && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> สร้างคูปองใหม่
          </button>
        )}
      </div>

      {/* Form Panel */}
      {(showForm || editingCoupon) && (
        <div className="max-w-2xl">
          <CouponForm
            initialData={editingCoupon}
            onSave={handleFormSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Main List */}
      {!showForm && !editingCoupon && (
        <>
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              กำลังโหลดข้อมูลคูปอง...
            </div>
          ) : coupons.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">ยังไม่มีคูปองส่วนลด</h3>
              <p className="text-xs text-slate-400 mb-5">สร้างคูปองแรกของคุณเพื่อมอบส่วนลดพิเศษในการสั่งซื้อสินค้าของลูกค้า</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary inline-flex items-center gap-2 rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> สร้างคูปองใหม่
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-sm bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-semibold uppercase">
                    <th className="p-4">รหัสคูปอง</th>
                    <th className="p-4">ประเภท/มูลค่าส่วนลด</th>
                    <th className="p-4">ยอดสั่งซื้อขั้นต่ำ</th>
                    <th className="p-4">ส่วนลดสูงสุด</th>
                    <th className="p-4">วันหมดอายุ</th>
                    <th className="p-4">สถานะ</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {coupons.map((c) => {
                    const isExpired = new Date(c.endDate) < new Date();
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900 bg-slate-50/30">
                          <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg border border-brand-100 text-[10px] inline-block uppercase">
                            {c.code}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">
                          {c.discountType === "PERCENTAGE" ? (
                            <span className="text-rose-600">ลด {c.discountValue}%</span>
                          ) : (
                            <span className="text-emerald-600">ลด {formatTHB(c.discountValue)}</span>
                          )}
                        </td>
                        <td className="p-4">{c.minPurchase > 0 ? formatTHB(c.minPurchase) : "ไม่มีขั้นต่ำ"}</td>
                        <td className="p-4">
                          {c.discountType === "PERCENTAGE" ? (
                            c.maxDiscount ? formatTHB(c.maxDiscount) : "ไม่จำกัด"
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(c.endDate).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </td>
                        <td className="p-4">
                          {isExpired ? (
                            <span className="inline-flex items-center rounded-md bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-bold border border-rose-100">
                              หมดอายุ
                            </span>
                          ) : c.isActive ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-100">
                              ใช้งานอยู่
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-slate-50 text-slate-400 px-2 py-0.5 text-[10px] font-bold border border-slate-200">
                              ปิดการใช้งาน
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setEditingCoupon(c)}
                              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-xl transition"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
