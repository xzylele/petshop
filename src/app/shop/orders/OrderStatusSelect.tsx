"use client";

// ตัวเลือกเปลี่ยนสถานะคำสั่งซื้อของร้าน และฟิลด์ใส่เลขพัสดุ (ปรับปรุงความเสถียรและ UI)
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, Save, Edit2, XCircle } from "lucide-react";

const STATUSES = ["PAID", "PREPARING", "SHIPPED", "COMPLETED", "CANCELLED"];

interface OrderStatusSelectProps {
  orderId: string;
  status: string;
  trackingNumber?: string | null;
}

export default function OrderStatusSelect({ orderId, status, trackingNumber }: OrderStatusSelectProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [trackNum, setTrackNum] = useState(trackingNumber ?? "");
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // อัปเดตสถานะและเลขพัสดุไปยัง API
  async function updateOrder(nextStatus: string, nextTracking: string | null) {
    setBusy(true);
    setSaved(false);
    
    try {
      const res = await fetch(`/api/shop/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: nextStatus, 
          trackingNumber: nextTracking || null 
        })
      });
      
      setBusy(false);
      if (res.ok) {
        setSaved(true);
        setCurrentStatus(nextStatus);
        setSelectedStatus(nextStatus);
        setIsEditingTracking(false);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    } catch (err) {
      setBusy(false);
    }
  }

  // ซิงค์ปุ่มแก้ไขหากสถานะจาก prop เปลี่ยนแปลง
  useEffect(() => {
    setCurrentStatus(status);
    setSelectedStatus(status);
    setTrackNum(trackingNumber ?? "");
  }, [status, trackingNumber]);

  const handleStatusChange = (nextStatus: string) => {
    setSelectedStatus(nextStatus);
    if (nextStatus === "SHIPPED") {
      // เปิดโหมดพิมพ์เลขพัสดุ (ยังไม่บันทึกเข้า DB จนกว่าจะกดเซฟ)
      setIsEditingTracking(true);
    } else {
      // อัปเดตสถานะอื่นทันที และล้างเลขพัสดุ
      updateOrder(nextStatus, null);
    }
  };

  const handleSaveTracking = () => {
    if (!trackNum.trim()) return;
    updateOrder(selectedStatus, trackNum);
  };

  const handleCancelTracking = () => {
    // รีเซ็ตค่ากลับเป็นสถานะเดิมที่บันทึกใน DB
    setSelectedStatus(currentStatus);
    setTrackNum(trackingNumber ?? "");
    setIsEditingTracking(false);
  };

  return (
    <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-[200px]">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase">สถานะรายการ</label>
        {saved && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> บันทึกแล้ว</span>}
      </div>

      <select
        disabled={busy}
        className="input text-xs w-full py-1.5"
        value={selectedStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === "PAID" ? "ชำระเงินแล้ว" :
             s === "PREPARING" ? "กำลังเตรียมสินค้า" :
             s === "SHIPPED" ? "จัดส่งแล้ว (SHIPPED)" :
             s === "COMPLETED" ? "สำเร็จ" :
             s === "CANCELLED" ? "ยกเลิก" : s}
          </option>
        ))}
      </select>

      {/* 1. มีเลขพัสดุอยู่แล้ว และไม่ได้อยู่ในโหมดแก้ไข */}
      {currentStatus === "SHIPPED" && !isEditingTracking && (
        <div className="text-xs space-y-1 mt-1 border-t border-slate-200/60 pt-1.5">
          <div className="text-[10px] text-slate-400 font-semibold">เลขพัสดุจัดส่ง:</div>
          <div className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 truncate" title={trackNum}>
            {trackNum || "ยังไม่ระบุ"}
          </div>
          <button
            type="button"
            onClick={() => setIsEditingTracking(true)}
            className="text-[10px] text-brand-600 font-bold hover:underline flex items-center gap-1 mt-1"
          >
            <Edit2 className="w-3 h-3" /> แก้ไขเลขพัสดุ
          </button>
        </div>
      )}

      {/* 2. โหมดกรอก/แก้ไขเลขพัสดุจัดส่ง (มีปุ่มบันทึก/ยกเลิกในกล่องเดียวกัน) */}
      {isEditingTracking && (
        <div className="mt-1 border-t border-slate-200/60 pt-1.5 space-y-2">
          <div className="text-[10px] text-brand-700 font-bold">ระบุเลขพัสดุจัดส่ง:</div>
          <input
            type="text"
            disabled={busy}
            autoFocus
            className="input text-xs py-1 px-2.5 font-mono border-brand-300 focus:border-brand-500 focus:ring-brand-200 bg-white"
            placeholder="KERRY / EMS / FLASH"
            value={trackNum}
            onChange={(e) => setTrackNum(e.target.value)}
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleSaveTracking}
              disabled={busy || !trackNum.trim()}
              className="flex-1 py-1 rounded bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[10px] flex items-center justify-center gap-1 shadow-sm disabled:opacity-40"
            >
              <Save className="w-3 h-3" /> บันทึก
            </button>
            <button
              type="button"
              onClick={handleCancelTracking}
              disabled={busy}
              className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 font-semibold text-[10px] flex items-center justify-center gap-1"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
