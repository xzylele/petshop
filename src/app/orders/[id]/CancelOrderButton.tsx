"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";

interface CancelOrderButtonProps {
  orderId: string;
  initialStatus: string;
}

export default function CancelOrderButton({ orderId, initialStatus }: CancelOrderButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // คุมสถานะปุ่ม
  const isCancelable = ["PENDING_PAYMENT", "PAID"].includes(initialStatus);

  if (!isCancelable) return null;

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?\n\n* การดำเนินการนี้จะเปลี่ยนสถานะคำสั่งซื้อเป็นยกเลิก และคืนสินค้าเข้าสต็อกร้านค้าทันที หากโอนเงินไปแล้วจะถือว่ารอติดต่อร้านเพื่อขอคืนเงิน"
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "ล้มเหลว");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 mt-4 w-full">
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 flex items-start gap-1.5 border border-red-100">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={handleCancel}
        className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 transition duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            กำลังยกเลิกคำสั่งซื้อ...
          </>
        ) : (
          "❌ ยกเลิกคำสั่งซื้อนี้"
        )}
      </button>
    </div>
  );
}
