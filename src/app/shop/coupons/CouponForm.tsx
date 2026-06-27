"use client";

import { useState } from "react";

interface Coupon {
  id?: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  endDate: string;
  isActive?: boolean;
  allowedCategory?: "ALL" | "PRODUCT" | "ANIMAL" | "SERVICE";
}

interface CouponFormProps {
  initialData?: Coupon | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function CouponForm({ initialData, onSave, onCancel }: CouponFormProps) {
  const [code, setCode] = useState(initialData?.code || "");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    initialData?.discountType || "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue || 0);
  const [minPurchase, setMinPurchase] = useState<number>(initialData?.minPurchase || 0);
  const [maxDiscount, setMaxDiscount] = useState<string>(
    initialData?.maxDiscount !== undefined && initialData?.maxDiscount !== null
      ? String(initialData.maxDiscount)
      : ""
  );
  const [endDate, setEndDate] = useState<string>(
    initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split("T")[0]
      : ""
  );
  const [isActive, setIsActive] = useState<boolean>(
    initialData?.isActive !== undefined ? initialData.isActive : true
  );
  const [allowedCategory, setAllowedCategory] = useState<"ALL" | "PRODUCT" | "ANIMAL" | "SERVICE">(
    initialData?.allowedCategory || "ALL"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("กรุณากรอกรหัสคูปอง");
      return;
    }
    if (discountValue <= 0) {
      setError("มูลค่าส่วนลดต้องมากกว่า 0");
      return;
    }
    if (!endDate) {
      setError("กรุณาระบุวันหมดอายุ");
      return;
    }

    setLoading(true);

    const payload = {
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minPurchase: Number(minPurchase),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      endDate,
      isActive,
      allowedCategory
    };

    try {
      const url = initialData?.id ? `/api/shop/coupons/${initialData.id}` : "/api/shop/coupons";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกคูปองไม่สำเร็จ");
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
      <h3 className="font-bold text-slate-800 text-base">
        {initialData ? "✏️ แก้ไขคูปองส่วนลด" : "➕ สร้างคูปองส่วนลดใหม่"}
      </h3>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
          ⚠️ {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* รหัสคูปอง */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="code">
            รหัสคูปอง (เช่น SUPER10)
          </label>
          <input
            id="code"
            type="text"
            required
            disabled={!!initialData}
            placeholder="รหัสภาษาอังกฤษ/ตัวเลข"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input mt-1 w-full uppercase"
          />
        </div>

        {/* ประเภทส่วนลด */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="discountType">
            ประเภทส่วนลด
          </label>
          <select
            id="discountType"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
            className="input mt-1 w-full"
          >
            <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
            <option value="FIXED">จำนวนเงินคงที่ (บาท)</option>
          </select>
        </div>

        {/* หมวดหมู่ที่ร่วมรายการ */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="allowedCategory">
            หมวดหมู่ที่ร่วมรายการ
          </label>
          <select
            id="allowedCategory"
            value={allowedCategory}
            onChange={(e) => setAllowedCategory(e.target.value as any)}
            className="input mt-1 w-full"
          >
            <option value="ALL">ลดทั้งหมด (สินค้า/สัตว์/บริการ)</option>
            <option value="PRODUCT">ลดเฉพาะสินค้าเท่านั้น</option>
            <option value="ANIMAL">ลดเฉพาะสัตว์เลี้ยงเท่านั้น</option>
            <option value="SERVICE">ลดเฉพาะบริการจองคิวเท่านั้น</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* มูลค่าส่วนลด */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="discountValue">
            มูลค่าส่วนลด
          </label>
          <input
            id="discountValue"
            type="number"
            required
            min="1"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="input mt-1 w-full"
          />
        </div>

        {/* ยอดซื้อขั้นต่ำ */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="minPurchase">
            ยอดซื้อขั้นต่ำ (บาท)
          </label>
          <input
            id="minPurchase"
            type="number"
            min="0"
            value={minPurchase}
            onChange={(e) => setMinPurchase(Number(e.target.value))}
            className="input mt-1 w-full"
          />
        </div>

        {/* ส่วนลดสูงสุด */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="maxDiscount">
            ส่วนลดสูงสุด (เฉพาะแบบ %)
          </label>
          <input
            id="maxDiscount"
            type="number"
            min="1"
            placeholder="ไม่จำกัด"
            disabled={discountType === "FIXED"}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* วันหมดอายุ */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="endDate">
            วันหมดอายุ
          </label>
          <input
            id="endDate"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>

        {/* สถานะใช้งาน */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase" htmlFor="isActive">
            สถานะคูปอง
          </label>
          <select
            id="isActive"
            value={String(isActive)}
            onChange={(e) => setIsActive(e.target.value === "true")}
            className="input mt-1 w-full"
          >
            <option value="true">เปิดใช้งาน (Active)</option>
            <option value="false">ปิดใช้งาน (Inactive)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-1 shadow-sm"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          บันทึกคูปอง
        </button>
      </div>
    </form>
  );
}
