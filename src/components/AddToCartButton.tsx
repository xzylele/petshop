"use client";

// ปุ่มเพิ่มสินค้า/สัตว์ลงตะกร้า (เรียก API /api/cart)

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId?: string;
  animalId?: string;
  disabled?: boolean;
  label?: string;
};

export default function AddToCartButton({ productId, animalId, disabled, label = "เพิ่มลงตะกร้า" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ส่งคำขอเพิ่มสินค้า/สัตว์แล้วรีเฟรชข้อมูลฝั่ง client
  async function addToCart() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, animalId, quantity: 1 })
    });
    setLoading(false);
    if (res.status === 401) {
      router.push("/login?callbackUrl=/cart");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "เพิ่มลงตะกร้าไม่สำเร็จ");
      return;
    }
    setMsg("เพิ่มลงตะกร้าแล้ว");
    router.refresh();
  }

  return (
    <div>
      <button onClick={addToCart} disabled={loading || disabled} className="btn-primary disabled:opacity-50">
        {loading ? "กำลังเพิ่ม..." : label}
      </button>
      {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
