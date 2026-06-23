"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookingActionsProps {
  bookingId: string;
  status: string;
}

export default function BookingActionsClient({ bookingId, status }: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    let confirmMsg = "";
    if (newStatus === "CONFIRMED") confirmMsg = "คุณต้องการยืนยันการจองนี้ใช่หรือไม่?";
    if (newStatus === "COMPLETED") confirmMsg = "คุณให้บริการเสร็จสิ้นแล้วใช่หรือไม่?";
    if (newStatus === "CANCELLED") confirmMsg = "คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?";

    if (confirmMsg && !confirm(confirmMsg)) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
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

  if (status === "COMPLETED" || status === "CANCELLED") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" && (
        <>
          <button
            onClick={() => updateStatus("CONFIRMED")}
            disabled={loading}
            className="rounded bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            ✅ ยืนยันการจอง
          </button>
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={loading}
            className="rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            ❌ ปฏิเสธ
          </button>
        </>
      )}

      {status === "CONFIRMED" && (
        <>
          <button
            onClick={() => updateStatus("COMPLETED")}
            disabled={loading}
            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ✨ เสร็จสิ้นบริการ
          </button>
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={loading}
            className="rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            ❌ ยกเลิกคิว
          </button>
        </>
      )}
    </div>
  );
}
