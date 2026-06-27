"use client";

// ฟอร์มสร้างคำสั่งซื้อและวิธีชำระเงิน พร้อมระบบสมุดที่อยู่จัดส่ง
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MapPin, Plus, Check, Save } from "lucide-react";

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

interface CheckoutFormProps {
  addresses: Address[];
}

export default function CheckoutForm({ addresses }: CheckoutFormProps) {
  const router = useRouter();

  // หาที่อยู่ที่เป็นค่าเริ่มต้น
  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

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

  // อัปเดตข้อมูลฟอร์มหลักเมื่อมีการเปลี่ยนที่อยู่หรือพิมพ์ใหม่
  useEffect(() => {
    if (selectedAddressId !== "new") {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        const formatted = `${addr.name}\nโทร: ${addr.phone}\n${addr.addressLine} ${addr.subDistrict ? `ต.${addr.subDistrict}` : ""} อ.${addr.district} จ.${addr.province} ${addr.postalCode}`;
        setForm(f => ({ ...f, address: formatted }));
      }
    } else {
      // หากเลือกกรอกที่อยู่ใหม่ ให้เคลียร์ฟิลด์ address หลัก
      setForm(f => ({ ...f, address: "" }));
    }
  }, [selectedAddressId, addresses]);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ส่งข้อมูลไปสร้างคำสั่งซื้อ แล้วพาไปหน้ารายละเอียดออเดอร์
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let finalAddress = form.address;

    // หากเป็นการกรอกที่อยู่ใหม่
    if (selectedAddressId === "new") {
      if (!newAddr.name.trim() || !newAddr.phone.trim() || !newAddr.addressLine.trim() || !newAddr.district.trim() || !newAddr.province.trim() || !newAddr.postalCode.trim()) {
        setError("กรุณากรอกข้อมูลที่อยู่จัดส่งใหม่ให้ครบถ้วน");
        setLoading(false);
        return;
      }

      finalAddress = `${newAddr.name}\nโทร: ${newAddr.phone}\n${newAddr.addressLine} ${newAddr.subDistrict ? `ต.${newAddr.subDistrict}` : ""} อ.${newAddr.district} จ.${newAddr.province} ${newAddr.postalCode}`;

      // หากติ๊กให้เซฟลงโปรไฟล์ด้วย
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
              isDefault: addresses.length === 0 // เซฟเป็นค่าเริ่มต้นถ้ายังไม่มีที่อยู่เลย
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

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: finalAddress,
        note: form.note,
        method: form.method
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
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      {/* 1. เลือกที่อยู่จัดส่ง */}
      <div>
        <label className="label font-bold text-slate-800 flex items-center gap-1">
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
                  {addr.addressLine} {addr.subDistrict && `ต.${addr.subDistrict}`} อ.${addr.district} จ.${addr.province} {addr.postalCode}
                </div>
              </div>
            ))}

            <div
              onClick={() => setSelectedAddressId("new")}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-3.5 transition-all text-xs flex flex-col items-center justify-center text-center gap-1.5 ${
                selectedAddressId === "new"
                  ? "border-brand-500 bg-brand-50/20 text-brand-700"
                  : "border-slate-350 hover:bg-slate-50/30 text-slate-500"
              }`}
            >
              <Plus className="w-5 h-5 text-slate-450" />
              <span className="font-bold">ระบุที่อยู่ใหม่สำหรับการจัดส่งนี้</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. ฟอร์มที่อยู่ใหม่ (แสดงเมื่อไม่มีที่อยู่เลย หรือเลือก "ระบุที่อยู่ใหม่") */}
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
                onChange={(e) => setNewAddr(n => ({ ...n, name: e.target.value }))}
                className="input w-full bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์ *</label>
              <input
                type="tel"
                placeholder="เบอร์โทรศัพท์ที่ติดต่อได้"
                value={newAddr.phone}
                onChange={(e) => setNewAddr(n => ({ ...n, phone: e.target.value }))}
                className="input w-full bg-white"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-600 mb-1">รายละเอียดที่อยู่ *</label>
            <textarea
              rows={2}
              placeholder="บ้านเลขที่, อาคาร, ซอย, ถนน"
              value={newAddr.addressLine}
              onChange={(e) => setNewAddr(n => ({ ...n, addressLine: e.target.value }))}
              className="input w-full bg-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">จังหวัด *</label>
              <input
                type="text"
                placeholder="จังหวัด"
                value={newAddr.province}
                onChange={(e) => setNewAddr(n => ({ ...n, province: e.target.value }))}
                className="input w-full bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">อำเภอ / เขต *</label>
              <input
                type="text"
                placeholder="อำเภอ/เขต"
                value={newAddr.district}
                onChange={(e) => setNewAddr(n => ({ ...n, district: e.target.value }))}
                className="input w-full bg-white"
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
                onChange={(e) => setNewAddr(n => ({ ...n, subDistrict: e.target.value }))}
                className="input w-full bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">รหัสไปรษณีย์ *</label>
              <input
                type="text"
                maxLength={5}
                placeholder="รหัสไปรษณีย์ 5 หลัก"
                value={newAddr.postalCode}
                onChange={(e) => setNewAddr(n => ({ ...n, postalCode: e.target.value }))}
                className="input w-full bg-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1.5 text-xs">
            <input
              type="checkbox"
              checked={newAddr.saveToProfile}
              onChange={(e) => setNewAddr(n => ({ ...n, saveToProfile: e.target.checked }))}
              className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 border-slate-300"
            />
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Save className="w-3.5 h-3.5 text-slate-450" /> บันทึกที่อยู่นี้ลงโปรไฟล์เพื่อสั่งซื้อครั้งถัดไป
            </span>
          </label>
        </div>
      )}

      {/* สรุปที่อยู่ที่จะจัดส่ง (แสดงเป็นกล่อง Preview แบบรีดโอนลี่เมื่อเลือกที่อยู่หลัก) */}
      {selectedAddressId !== "new" && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/10 p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">ที่อยู่จัดส่งที่เลือก</div>
          <div className="text-xs text-slate-700 whitespace-pre-wrap mt-1 font-medium leading-relaxed">
            {form.address}
          </div>
        </div>
      )}

      <div>
        <label className="label font-bold text-slate-800">📝 หมายเหตุเพิ่มเติม (ถ้ามี)</label>
        <textarea 
          rows={2} 
          className="input text-xs" 
          placeholder="เช่น ระบุสีที่ต้องการ หรือแจ้งให้พนักงานส่งของโทรหาก่อนส่ง"
          value={form.note} 
          onChange={(e) => up("note", e.target.value)} 
        />
      </div>

      <div>
        <label className="label font-bold text-slate-800">💳 วิธีชำระเงิน</label>
        <div className="grid gap-3 md:grid-cols-2 mt-1.5">
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all text-xs font-semibold ${form.method === "QR_CODE" ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500/20" : "border-slate-200 hover:bg-slate-50/30"}`}>
            <input type="radio" name="method" checked={form.method === "QR_CODE"} onChange={() => up("method", "QR_CODE")} className="text-brand-600 focus:ring-brand-500" />
            <span className="flex items-center gap-1.5"><span className="text-xl">📱</span> QR PromptPay</span>
          </label>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all text-xs font-semibold ${form.method === "BANK_TRANSFER" ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500/20" : "border-slate-200 hover:bg-slate-50/30"}`}>
            <input type="radio" name="method" checked={form.method === "BANK_TRANSFER"} onChange={() => up("method", "BANK_TRANSFER")} className="text-brand-600 focus:ring-brand-500" />
            <span className="flex items-center gap-1.5"><span className="text-xl">🏦</span> โอนเข้าบัญชีธนาคาร</span>
          </label>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-medium text-red-700">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base font-bold shadow-md shadow-brand-100 disabled:opacity-50">
        {loading ? "กำลังสร้างคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
      </button>
    </form>
  );
}
