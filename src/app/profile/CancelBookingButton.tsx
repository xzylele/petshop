"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?")) return;

    setLoading(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ไม่สามารถยกเลิกการจองได้");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "กำลังยกเลิก..." : "ยกเลิกการจอง"}
    </button>
  );
}
