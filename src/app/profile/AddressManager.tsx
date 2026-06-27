"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  AlertCircle,
  Loader2 
} from "lucide-react";

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

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สเตตในการคุม Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // สเตตข้อมูลฟอร์ม
  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressLine: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    isDefault: false
  });

  // โหลดรายการที่อยู่ทั้งหมด
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/addresses");
      if (!res.ok) throw new Error("ดึงข้อมูลที่อยู่ล้มเหลว");
      const data = await res.json();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // เปิดแบบฟอร์มเพื่อสร้างใหม่
  const handleOpenAdd = () => {
    setEditingAddress(null);
    setForm({
      name: "",
      phone: "",
      addressLine: "",
      subDistrict: "",
      district: "",
      province: "",
      postalCode: "",
      isDefault: addresses.length === 0 // ถ้ายังไม่มีเลย บังคับให้เป็นค่าเริ่มต้น
    });
    setError(null);
    setShowModal(true);
  };

  // เปิดแบบฟอร์มเพื่อแก้ไข
  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    setForm({
      name: addr.name,
      phone: addr.phone,
      addressLine: addr.addressLine,
      subDistrict: addr.subDistrict || "",
      district: addr.district,
      province: addr.province,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault
    });
    setError(null);
    setShowModal(true);
  };

  // บันทึกฟอร์ม (ทั้งสร้างและแก้ไข)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.addressLine.trim() || !form.district.trim() || !form.province.trim() || !form.postalCode.trim()) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setActionLoading(true);
    setError(null);

    const url = editingAddress ? `/api/addresses/${editingAddress.id}` : "/api/addresses";
    const method = editingAddress ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setShowModal(false);
      fetchAddresses();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  };

  // ลบที่อยู่จัดส่ง
  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบที่อยู่จัดส่งนี้ใช่หรือไม่?")) return;

    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ลบข้อมูลไม่สำเร็จ");
      }

      fetchAddresses();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
      setActionLoading(false);
    }
  };

  // เปลี่ยนที่อยู่หลักอย่างรวดเร็ว
  const handleSetDefault = async (addr: Address) => {
    if (addr.isDefault) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/addresses/${addr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addr.name,
          phone: addr.phone,
          addressLine: addr.addressLine,
          subDistrict: addr.subDistrict,
          district: addr.district,
          province: addr.province,
          postalCode: addr.postalCode,
          isDefault: true
        })
      });
      if (!res.ok) throw new Error("ตั้งเป็นที่อยู่หลักไม่สำเร็จ");
      fetchAddresses();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-5 h-5 text-brand-600" /> ที่อยู่จัดส่งของฉัน
        </h2>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1 shadow-sm hover:shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          เพิ่มที่อยู่ใหม่
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">กำลังโหลดที่อยู่จัดส่ง...</span>
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <p className="text-sm text-slate-500">คุณยังไม่มีที่อยู่จัดส่งที่บันทึกไว้ในสมุดที่อยู่</p>
          <p className="text-xs text-slate-400 mt-1">เพิ่มที่อยู่เพื่อความสะดวกรวดเร็วในการชำระเงินสั่งซื้อสินค้า</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-xl border p-4 transition-all duration-200 bg-white shadow-sm flex flex-col justify-between ${
                addr.isDefault
                  ? "border-brand-500 ring-1 ring-brand-500/20"
                  : "border-slate-200 hover:border-slate-350"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">{addr.name}</span>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-100">
                      <Check className="w-3 h-3" /> ค่าเริ่มต้น
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleSetDefault(addr)}
                      className="text-[10px] text-slate-400 hover:text-brand-600 hover:underline"
                    >
                      ตั้งเป็นที่อยู่หลัก
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-600 space-y-1 mt-1.5 font-medium">
                  <div>📞 {addr.phone}</div>
                  <div className="text-slate-500 leading-relaxed break-words font-normal">
                    {addr.addressLine} {addr.subDistrict && `ต.${addr.subDistrict}`} อ.${addr.district} จ.${addr.province} {addr.postalCode}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleOpenEdit(addr)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-650 font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" /> แก้ไข
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDelete(addr.id)}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ฟอร์มที่อยู่ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {editingAddress ? "📝 แก้ไขที่อยู่จัดส่ง" : "➕ เพิ่มที่อยู่จัดส่งใหม่"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-650 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-700">
              {/* ชื่อผู้รับ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้รับ *</label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อ-นามสกุล ผู้รับพัสดุ"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input w-full p-2.5"
                />
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  required
                  placeholder="เช่น 0891234567"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input w-full p-2.5"
                />
              </div>

              {/* รายละเอียดที่อยู่ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รายละเอียดที่อยู่ *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="บ้านเลขที่, หมู่บ้าน, ถนน, ซอย ฯลฯ"
                  value={form.addressLine}
                  onChange={(e) => setForm(f => ({ ...f, addressLine: e.target.value }))}
                  className="input w-full p-2.5"
                />
              </div>

              {/* จังหวัด, อำเภอ, ตำบล, รหัสไปรษณีย์ */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จังหวัด *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กรุงเทพฯ, เชียงใหม่"
                    value={form.province}
                    onChange={(e) => setForm(f => ({ ...f, province: e.target.value }))}
                    className="input w-full p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อำเภอ / เขต *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น พญาไท, เมือง"
                    value={form.district}
                    onChange={(e) => setForm(f => ({ ...f, district: e.target.value }))}
                    className="input w-full p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำบล / แขวง</label>
                  <input
                    type="text"
                    placeholder="เช่น สามเสนใน (ไม่บังคับ)"
                    value={form.subDistrict}
                    onChange={(e) => setForm(f => ({ ...f, subDistrict: e.target.value }))}
                    className="input w-full p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสไปรษณีย์ *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="เช่น 10400"
                    value={form.postalCode}
                    onChange={(e) => setForm(f => ({ ...f, postalCode: e.target.value }))}
                    className="input w-full p-2.5"
                  />
                </div>
              </div>

              {/* ตั้งเป็นที่อยู่เริ่มต้น */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  disabled={addresses.length === 0} // ถ้าเป็นชิ้นแรกบังคับเป็น true อยู่แล้ว
                  onChange={(e) => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded text-brand-650 focus:ring-brand-500 h-4 w-4 border-slate-300"
                />
                <span className="text-slate-600 font-medium">ตั้งเป็นที่อยู่จัดส่งเริ่มต้น</span>
              </label>

              <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline w-full py-2.5 font-semibold text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary w-full py-2.5 font-semibold text-center flex items-center justify-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
