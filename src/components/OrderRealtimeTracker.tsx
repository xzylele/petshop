"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

interface OrderRealtimeTrackerProps {
  orderId: string;
  initialStatus: string;
  initialTracking?: string | null;
  initialPaymentStatus?: string | null;
}

export default function OrderRealtimeTracker({
  orderId,
  initialStatus,
  initialTracking,
  initialPaymentStatus
}: OrderRealtimeTrackerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [tracking, setTracking] = useState(initialTracking ?? null);
  const [payStatus, setPayStatus] = useState(initialPaymentStatus ?? null);

  useEffect(() => {
    // ซิงค์สเตทเริ่มต้นหากมีการโหลดซ้ำ
    setStatus(initialStatus);
    setTracking(initialTracking ?? null);
    setPayStatus(initialPaymentStatus ?? null);
  }, [initialStatus, initialTracking, initialPaymentStatus]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // เริ่ม Polling เช็คข้อมูลทุกๆ 3 วินาที
    const pollOrderStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;

        const data = await res.json();
        const nextStatus = data.status;
        const nextTracking = data.trackingNumber;
        const nextPayStatus = data.payment?.status ?? null;

        // ตรวจสอบความเปลี่ยนแปลงในส่วนใดส่วนหนึ่ง
        if (
          nextStatus !== status ||
          nextTracking !== tracking ||
          nextPayStatus !== payStatus
        ) {
          // อัปเดตสเตท Client
          setStatus(nextStatus);
          setTracking(nextTracking);
          setPayStatus(nextPayStatus);

          // บอก Next.js ให้เคลียร์แคชฝั่ง Server Component และโหลดข้อมูล HTML ใหม่แบบเรียลไทม์
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to poll order status:", err);
      }
    };

    intervalId = setInterval(pollOrderStatus, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [orderId, status, tracking, payStatus, router]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/60 border border-emerald-200/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      <span className="flex items-center gap-0.5 tracking-wide">
        <Activity className="w-3 h-3 text-emerald-600 shrink-0" />
        อัปเดตสด (Live)
      </span>
    </div>
  );
}
