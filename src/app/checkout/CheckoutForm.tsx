"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MapPin, Plus, Check, Save, Tag, Gift, Coins, AlertCircle, Trash2 } from "lucide-react";
import { formatTHB } from "@/lib/utils";

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine: string;
  province: string;
  district: string;
  subDistrict: string | null;
  postalCode: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  shopId: string | null;
  imageUrl: string | null;
}

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  shopName: string;
  allowedCategory: "ALL" | "PRODUCT" | "ANIMAL" | "SERVICE";
}

interface CheckoutFormProps {
  addresses: Address[];
  items: CartItem[];
  initialTotal: number;
  userPoints: number;
  availableCoupons: Coupon[];
}

export default function CheckoutForm({
  addresses,
  items,
  initialTotal,
  userPoints,
  availableCoupons
}: CheckoutFormProps) {
  const router = useRouter();

  // หาที่อยู่ที่เป็นค่าเริ่มต้น
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  // สเตตการเลือกที่อยู่
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress ? defaultAddress.id : "new"
  );

  // สเตตที่อยู่ใหม่
  const [newAddr, setNewAddr] = useState({
    name: "",
    phone: "",
    addressLine: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    saveToProfile: true
  });

  const [form, setForm] = useState({
    address: "",
    note: "",
    method: "QR_CODE" as "QR_CODE" | "BANK_TRANSFER"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- สเตตสำหรับคูปองและพอยท์ ---
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [usePoints, setUsePoints] = useState(false);
  const [pointsInput, setPointsInput] = useState(0);

  // อัปเดตข้อมูลฟอร์มหลักเมื่อมีการเปลี่ยนที่อยู่หรือพิมพ์ใหม่
  useEffect(() => {
    if (selectedAddressId !== "new") {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        const formatted = `${addr.name}\nโทร: ${addr.phone}\n${addr.addressLine} ${
          addr.subDistrict ? `ต.${addr.subDistrict}` : ""
        } อ.${addr.district} จ.${addr.province} ${addr.postalCode}`;
        setForm((f) => ({ ...f, address: formatted }));
      }
    } else {
      setForm((f) => ({ ...f, address: "" }));
    }
  }, [selectedAddressId, addresses]);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // --- ฟังก์ชันการใช้คูปอง ---
  async function handleApplyCoupon(code: string) {
    if (!code.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถใช้งานคูปองได้");
      }
      setAppliedCoupon(data);
      setCouponCodeInput(data.code);
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError(null);
  }

  // --- คำนวณราคาส่วนลด ---
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const subtotalAfterCoupon = Math.max(0, initialTotal - discount);

  // คำนวณขีดจำกัดคะแนนสะสม
  const maxPointsAllowed = Math.min(userPoints, subtotalAfterCoupon);
  const pointsUsed = usePoints ? Math.min(pointsInput, maxPointsAllowed) : 0;
  const finalTotal = Math.max(0, subtotalAfterCoupon - pointsUsed);

  // อัปเดตตัวเลขการกรอกคะแนนสะสมเริ่มต้นให้เต็มโควตา
  useEffect(() => {
    if (usePoints) {
      setPointsInput(maxPointsAllowed);
    } else {
      setPointsInput(0);
    }
  }, [usePoints, maxPointsAllowed]);

  // ส่งข้อมูลสร้างคำสั่งซื้อ
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let finalAddress = form.address;

    if (selectedAddressId === "new") {
      if (
        !newAddr.name.trim() ||
        !newAddr.phone.trim() ||
        !newAddr.addressLine.trim() ||
        !newAddr.district.trim() ||
        !newAddr.province.trim() ||
        !newAddr.postalCode.trim()
      ) {
        setError("กรุณากรอกข้อมูลที่อยู่จัดส่งใหม่ให้ครบถ้วน");
        setLoading(false);
        return;
      }

      finalAddress = `${newAddr.name}\nโทร: ${newAddr.phone}\n${newAddr.addressLine} ${
        newAddr.subDistrict ? `ต.${newAddr.subDistrict}` : ""
      } อ.${newAddr.district} จ.${newAddr.province} ${newAddr.postalCode}`;

      if (newAddr.saveToProfile) {
        try {
          const resAddr = await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newAddr.name,
              phone: newAddr.phone,
              addressLine: newAddr.addressLine,
              subDistrict: newAddr.subDistrict,
              district: newAddr.district,
              province: newAddr.province,
              postalCode: newAddr.postalCode,
              isDefault: addresses.length === 0
            })
          });
          if (!resAddr.ok) {
            console.error("บันทึกที่อยู่ลงโปรไฟล์ล้มเหลว");
          }
        } catch (err) {
          console.error("เกิดข้อผิดพลาดในการบันทึกที่อยู่", err);
        }
      }
    }

    if (!finalAddress.trim()) {
      setError("กรุณาระบุที่อยู่จัดส่ง");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: finalAddress,
          note: form.note,
          method: form.method,
          couponCode: appliedCoupon?.code || null,
          usePoints: usePoints
        })
      });

      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "สร้างคำสั่งซื้อไม่สำเร็จ");
        return;
      }

      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-3 items-start">
      {/* ฝั่งซ้าย: ที่อยู่จัดส่งและวิธีชำระเงิน */}
      <div className="md:col-span-2 card space-y-5 p-6 bg-white">
        {/* 1. เลือกที่อยู่จัดส่ง */}
        <div>
          <label className="label font-bold text-slate-800 flex items-center gap-1 text-sm">
            <MapPin className="w-4 h-4 text-brand-600" /> ที่อยู่จัดส่งพัสดุ
          </label>

          {addresses.length > 0 && (
            <div className="grid gap-2.5 sm:grid-cols-2 mt-2 mb-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all text-xs relative ${
                    selectedAddressId === addr.id
                      ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500/20"
                      : "border-slate-200 hover:bg-slate-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800">{addr.name}</span>
                    {selectedAddressId === addr.id && (
                      <span className="text-brand-600 bg-brand-50 rounded-full p-0.5 border border-brand-100">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 font-medium">📞 {addr.phone}</div>
                  <div className="text-slate-500 line-clamp-2 mt-0.5">
                    {addr.addressLine} {addr.subDistrict && `ต.${addr.subDistrict}`} อ.${
                      addr.district
                    } จ.${addr.province} {addr.postalCode}
                  </div>
                </div>
              ))}

              <div
                onClick={() => setSelectedAddressId("new")}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-3.5 transition-all text-xs flex flex-col items-center justify-center text-center gap-1.5 ${
                  selectedAddressId === "new"
                    ? "border-brand-500 bg-brand-50/20 text-brand-700"
                    : "border-slate-300 hover:bg-slate-50/30 text-slate-500"
                }`}
              >
                <Plus className="w-5 h-5 text-slate-450" />
                <span className="font-bold">ระบุที่อยู่ใหม่สำหรับการจัดส่งนี้</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. ฟอร์มที่อยู่ใหม่ */}
        {selectedAddressId === "new" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1">
              📍 กรอกข้อมูลที่อยู่จัดส่งใหม่
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">ชื่อผู้รับ *</label>
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล ผู้รับพัสดุ"
                  value={newAddr.name}
                  onChange={(e) => setNewAddr((n) => ({ ...n, name: e.target.value }))}
                  className="input w-full bg-white rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  placeholder="เบอร์โทรศัพท์ที่ติดต่อได้"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr((n) => ({ ...n, phone: e.target.value }))}
                  className="input w-full bg-white rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-600 mb-1">รายละเอียดที่อยู่ *</label>
              <textarea
                rows={2}
                placeholder="บ้านเลขที่, อาคาร, ซอย, ถนน"
                value={newAddr.addressLine}
                onChange={(e) => setNewAddr((n) => ({ ...n, addressLine: e.target.value }))}
                className="input w-full bg-white rounded-xl border-slate-200"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">จังหวัด *</label>
                <input
                  type="text"
                  placeholder="จังหวัด"
                  value={newAddr.province}
                  onChange={(e) => setNewAddr((n) => ({ ...n, province: e.target.value }))}
                  className="input w-full bg-white rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">อำเภอ / เขต *</label>
                <input
                  type="text"
                  placeholder="อำเภอ/เขต"
                  value={newAddr.district}
                  onChange={(e) => setNewAddr((n) => ({ ...n, district: e.target.value }))}
                  className="input w-full bg-white rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">ตำบล / แขวง</label>
                <input
                  type="text"
                  placeholder="ตำบล/แขวง (ไม่บังคับ)"
                  value={newAddr.subDistrict}
                  onChange={(e) => setNewAddr((n) => ({ ...n, subDistrict: e.target.value }))}
                  className="input w-full bg-white rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">รหัสไปรษณีย์ *</label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="รหัสไปรษณีย์ 5 หลัก"
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr((n) => ({ ...n, postalCode: e.target.value }))}
                  className="input w-full bg-white rounded-xl border-slate-200"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1.5 text-xs">
              <input
                type="checkbox"
                checked={newAddr.saveToProfile}
                onChange={(e) => setNewAddr((n) => ({ ...n, saveToProfile: e.target.checked }))}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 border-slate-300"
              />
              <span className="text-slate-600 font-semibold flex items-center gap-1">
                <Save className="w-3.5 h-3.5 text-slate-450" /> บันทึกที่อยู่นี้ลงโปรไฟล์เพื่อสั่งซื้อครั้งถัดไป
              </span>
            </label>
          </div>
        )}

        {/* สรุปที่อยู่จัดส่ง */}
        {selectedAddressId !== "new" && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/10 p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">
              ที่อยู่จัดส่งที่เลือก
            </div>
            <div className="text-xs text-slate-700 whitespace-pre-wrap mt-1 font-medium leading-relaxed">
              {form.address}
            </div>
          </div>
        )}

        <div>
          <label className="label font-bold text-slate-800 text-sm">📝 หมายเหตุเพิ่มเติม (ถ้ามี)</label>
          <textarea
            rows={2}
            className="input text-xs w-full mt-1 rounded-xl border-slate-200"
            placeholder="เช่น ระบุสีที่ต้องการ หรือแจ้งให้พนักงานส่งของโทรหาก่อนส่ง"
            value={form.note}
            onChange={(e) => up("note", e.target.value)}
          />
        </div>

        <div>
          <label className="label font-bold text-slate-800 text-sm">💳 วิธีชำระเงิน</label>
          <div className="grid gap-3 md:grid-cols-2 mt-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all text-xs font-semibold ${
                form.method === "QR_CODE"
                  ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500/20"
                  : "border-slate-200 hover:bg-slate-50/30"
              }`}
            >
              <input
                type="radio"
                name="method"
                checked={form.method === "QR_CODE"}
                onChange={() => up("method", "QR_CODE")}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="flex items-center gap-1.5">
                <span className="text-xl">📱</span> QR PromptPay
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all text-xs font-semibold ${
                form.method === "BANK_TRANSFER"
                  ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500/20"
                  : "border-slate-200 hover:bg-slate-50/30"
              }`}
            >
              <input
                type="radio"
                name="method"
                checked={form.method === "BANK_TRANSFER"}
                onChange={() => up("method", "BANK_TRANSFER")}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="flex items-center gap-1.5">
                <span className="text-xl">🏦</span> โอนเข้าบัญชีธนาคาร
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: รายการสินค้า, คูปอง, แลกพอยท์, ปุ่ม ยืนยัน */}
      <aside className="space-y-4">
        {/* รายการคำสั่งซื้อ */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <h2 className="text-sm font-bold text-slate-800 mb-3.5">สรุปคำสั่งซื้อ</h2>
          <ul className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between items-start text-xs">
                <div className="truncate pr-3">
                  <span className="font-semibold text-slate-800 block truncate">{it.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">จำนวน: {it.quantity} ชิ้น</span>
                </div>
                <span className="font-bold text-slate-900 shrink-0">{formatTHB(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* กล่องใส่รหัสคูปองและคะแนนสะสม */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-2xl space-y-4">
          {/* ระบบคูปองส่วนลด */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Tag className="w-4 h-4 text-brand-600" /> คูปองส่วนลด
            </label>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-250 text-xs">
                <span className="font-bold uppercase flex items-center gap-1">
                  🎟️ {appliedCoupon.code} (ลด {formatTHB(appliedCoupon.discount)})
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-rose-600 hover:text-rose-800 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ใส่โค้ดส่วนลด"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="input text-xs w-full rounded-xl border-slate-200 uppercase"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon || !couponCodeInput.trim()}
                    onClick={() => handleApplyCoupon(couponCodeInput)}
                    className="px-3 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 rounded-xl shrink-0"
                  >
                    ใช้โค้ด
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {couponError}
                  </p>
                )}

                {/* แสดงคูปองที่มีอยู่ */}
                {availableCoupons.length > 0 && (
                  <div className="pt-1.5">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1.5">คูปองที่คุณใช้ได้:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto">
                      {availableCoupons.map((c) => {
                        let categoryText = "";
                        if (c.allowedCategory === "PRODUCT") categoryText = " (เฉพาะสินค้า)";
                        if (c.allowedCategory === "ANIMAL") categoryText = " (เฉพาะสัตว์เลี้ยง)";
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCouponCodeInput(c.code);
                              handleApplyCoupon(c.code);
                            }}
                            className="bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 text-left transition uppercase"
                            title={`ใช้ส่วนลดกับหมวดหมู่: ${c.allowedCategory}`}
                          >
                            🎫 {c.code}{categoryText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* ระบบแต้มสะสม */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Coins className="w-4 h-4 text-brand-600" /> แลกแต้มสะสม
            </label>
            <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs space-y-2">
              <div className="flex justify-between font-medium text-slate-600">
                <span>แต้มสะสมปัจจุบัน:</span>
                <span className="font-bold text-slate-800">{userPoints} แต้ม</span>
              </div>
              {maxPointsAllowed > 0 ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 pt-1">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 border-slate-300"
                    />
                    <span>ใช้แต้มแทนส่วนลดเงินสด</span>
                  </label>
                  {usePoints && (
                    <div className="pt-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          max={maxPointsAllowed}
                          min={0}
                          value={pointsInput}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPointsInput(Math.max(0, Math.min(val, maxPointsAllowed)));
                          }}
                          className="input w-24 bg-white text-center rounded-lg border-slate-200 font-bold"
                        />
                        <span className="text-slate-500 font-medium">แต้ม</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        * แลกใช้ได้สูงสุด {maxPointsAllowed} แต้ม (1 แต้ม = 1 บาท)
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-[10px] text-slate-400 block pt-1">
                  * คุณยังไม่มียอดซื้อที่แลกแต้มได้ในขณะนี้
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ยอดเงินสุทธิ */}
        <div className="card p-5 bg-slate-50 border border-slate-250/50 rounded-2xl space-y-3">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>ยอดรวมสินค้า</span>
            <span>{formatTHB(initialTotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-xs text-rose-600 font-medium">
              <span>ส่วนลดคูปอง</span>
              <span>-{formatTHB(discount)}</span>
            </div>
          )}

          {pointsUsed > 0 && (
            <div className="flex justify-between text-xs text-rose-600 font-medium">
              <span>ส่วนลดแต้มสะสม</span>
              <span>-{formatTHB(pointsUsed)}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-sm font-bold text-slate-800">
            <span>ยอดชำระเงินสุทธิ</span>
            <span className="text-xl font-black text-brand-600">{formatTHB(finalTotal)}</span>
          </div>

          <div className="pt-1 border-t border-dashed border-slate-200 flex justify-between text-[10px] text-brand-700 font-semibold">
            <span className="flex items-center gap-0.5">💰 แต้มสะสมที่จะได้รับ:</span>
            <span>+{Math.floor(finalTotal * 0.05)} แต้ม (5%)</span>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-base font-bold shadow-md shadow-brand-100 disabled:opacity-50 rounded-2xl"
        >
          {loading ? "กำลังสร้างคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
        </button>
      </aside>
    </form>
  );
}
