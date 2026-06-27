"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit3, X, Save, AlertCircle } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  petName: string;
  petType: string;
  petWeight: number | null;
  dateTime: Date | string;
  checkOutDateTime: Date | string | null;
  notes: string | null;
  price: number;
  serviceType: string;
  days: number | null;
}

interface BookingActionsProps {
  booking: Booking;
}

export default function BookingActionsClient({ booking }: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สเตตสำหรับหน้าจอฟอร์มแก้ไข
  const [statusInput, setStatusInput] = useState(booking.status);
  const [petNameInput, setPetNameInput] = useState(booking.petName);
  const [petTypeInput, setPetTypeInput] = useState(booking.petType);
  const [petWeightInput, setPetWeightInput] = useState(
    booking.petWeight !== null ? String(booking.petWeight) : ""
  );
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [checkOutInput, setCheckOutInput] = useState("");
  const [priceInput, setPriceInput] = useState(booking.price);
  const [notesInput, setNotesInput] = useState(booking.notes || "");

  // จัดการฟอร์แมตข้อมูลวันที่ให้อยู่ในฟอร์ม YYYY-MM-DDTHH:MM สำหรับ input type="datetime-local"
  const formatToDatetimeLocal = (dateInput: Date | string | null) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  useEffect(() => {
    setDateTimeInput(formatToDatetimeLocal(booking.dateTime));
    setCheckOutInput(formatToDatetimeLocal(booking.checkOutDateTime));
  }, [booking]);

  // คำนวณราคาอัตโนมัติเมื่อวันที่ฝากเลี้ยงเปลี่ยนไป (เฉพาะ Pet Hotel)
  useEffect(() => {
    if (booking.serviceType === "PET_HOTEL" && dateTimeInput && checkOutInput) {
      const checkIn = new Date(dateTimeInput);
      const checkOut = new Date(checkOutInput);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedDays = diffDays > 0 ? diffDays : 1;
      setPriceInput(calculatedDays * 500);
    }
  }, [dateTimeInput, checkOutInput, booking.serviceType]);

  const updateStatus = async (newStatus: string) => {
    let confirmMsg = "";
    if (newStatus === "CONFIRMED") confirmMsg = "คุณต้องการยืนยันการจองนี้ใช่หรือไม่?";
    if (newStatus === "COMPLETED") confirmMsg = "คุณให้บริการเสร็จสิ้นแล้วใช่หรือไม่?";
    if (newStatus === "CANCELLED") confirmMsg = "คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?";

    if (confirmMsg && !confirm(confirmMsg)) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!petNameInput.trim()) {
      setError("กรุณากรอกชื่อสัตว์เลี้ยง");
      setLoading(false);
      return;
    }
    if (!dateTimeInput) {
      setError("กรุณาระบุวันเวลานัดหมาย");
      setLoading(false);
      return;
    }

    let calculatedDays: number | null = null;
    if (booking.serviceType === "PET_HOTEL") {
      if (!checkOutInput) {
        setError("กรุณาระบุวันเช็คเอาต์");
        setLoading(false);
        return;
      }
      const checkIn = new Date(dateTimeInput);
      const checkOut = new Date(checkOutInput);
      if (checkOut <= checkIn) {
        setError("วันเวลาเช็คเอาต์ต้องเป็นเวลาหลังจากเช็คอิน");
        setLoading(false);
        return;
      }
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      calculatedDays = diffDays > 0 ? diffDays : 1;
    }

    const payload = {
      status: statusInput,
      petName: petNameInput,
      petType: petTypeInput,
      petWeight: petWeightInput ? Number(petWeightInput) : null,
      dateTime: dateTimeInput,
      checkOutDateTime: booking.serviceType === "PET_HOTEL" ? checkOutInput : null,
      price: Number(priceInput),
      notes: notesInput,
      days: calculatedDays
    };

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      setEditOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      {/* ปุ่มกดแก้ไขคิว (แสดงทุกสถานะ) */}
      <button
        onClick={() => setEditOpen(true)}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition flex items-center gap-1"
      >
        <Edit3 className="w-3.5 h-3.5" /> แก้ไขคิว
      </button>

      {/* ปุ่มด่วนตามสถานะเดิม */}
      {booking.status === "PENDING" && (
        <>
          <button
            onClick={() => updateStatus("CONFIRMED")}
            disabled={loading}
            className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition"
          >
            ✅ ยืนยันการจอง
          </button>
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={loading}
            className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-650 hover:bg-red-100 disabled:opacity-50 transition"
          >
            ❌ ปฏิเสธ
          </button>
        </>
      )}

      {booking.status === "CONFIRMED" && (
        <>
          <button
            onClick={() => updateStatus("COMPLETED")}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            ✨ เสร็จสิ้นบริการ
          </button>
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={loading}
            className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-650 hover:bg-red-100 disabled:opacity-50 transition"
          >
            ❌ ยกเลิกคิว
          </button>
        </>
      )}

      {/* Modal หน้าต่างลอยเพื่อการแก้ไขรายละเอียดคิวจอง */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                🗓️ แก้ไขรายละเอียดการจองคิว
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                className="text-slate-450 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveChanges} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* ข้อมูลสัตว์เลี้ยง */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ชื่อสัตว์เลี้ยง</label>
                  <input
                    type="text"
                    required
                    value={petNameInput}
                    onChange={(e) => setPetNameInput(e.target.value)}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ประเภทสัตว์เลี้ยง</label>
                  <select
                    value={petTypeInput}
                    onChange={(e) => setPetTypeInput(e.target.value)}
                    className="input w-full rounded-xl border-slate-200"
                  >
                    <option value="สุนัข">สุนัข</option>
                    <option value="แมว">แมว</option>
                    <option value="กระต่าย">กระต่าย</option>
                    <option value="นก">นก</option>
                    <option value="อื่น ๆ">อื่น ๆ</option>
                  </select>
                </div>
              </div>

              {/* น้ำหนักและราคา */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    น้ำหนัก (กก.) {booking.serviceType === "PET_HOTEL" ? "(ไม่บังคับ)" : ""}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={petWeightInput}
                    onChange={(e) => setPetWeightInput(e.target.value)}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ค่าบริการ (บาท)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    className="input w-full rounded-xl border-slate-200 font-bold text-brand-600"
                  />
                </div>
              </div>

              {/* วันเวลานัดหมาย */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {booking.serviceType === "PET_HOTEL" ? "🗓️ วันที่เช็คอิน" : "🗓️ วันเวลานัดหมาย"}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTimeInput}
                    onChange={(e) => setDateTimeInput(e.target.value)}
                    className="input w-full rounded-xl border-slate-200"
                  />
                </div>
                {booking.serviceType === "PET_HOTEL" && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">🗓️ วันที่เช็คเอาต์</label>
                    <input
                      type="datetime-local"
                      required
                      value={checkOutInput}
                      onChange={(e) => setCheckOutInput(e.target.value)}
                      className="input w-full rounded-xl border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* สถานะการจอง */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">สถานะคิวจอง</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="input w-full rounded-xl border-slate-200 font-semibold"
                >
                  <option value="PENDING">รอการยืนยัน (Pending)</option>
                  <option value="CONFIRMED">ยืนยันแล้ว/กำลังบริการ (Confirmed)</option>
                  <option value="COMPLETED">เสร็จสิ้นบริการ (Completed)</option>
                  <option value="CANCELLED">ยกเลิกแล้ว (Cancelled)</option>
                </select>
              </div>

              {/* ความต้องการพิเศษ */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">ความต้องการเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติมจากลูกค้า หรือโน้ตของร้านค้า"
                  className="input w-full rounded-xl border-slate-200"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2.5 text-slate-650 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-1.5 shadow-sm transition"
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
