"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Loader2 } from "lucide-react";

interface QuickStockEditorProps {
  productId: string;
  initialStock: number;
}

export default function QuickStockEditor({ productId, initialStock }: QuickStockEditorProps) {
  const router = useRouter();
  const [stock, setStock] = useState(initialStock);
  const [updating, setUpdating] = useState(false);

  // ซิงค์สเตทเมื่อค่าเริ่มต้นเปลี่ยนจากภายนอก
  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  const updateStock = async (newStock: number) => {
    if (newStock < 0 || updating) return;

    // อัปเดตสเตท UI ทันที (Optimistic update)
    const prevStock = stock;
    setStock(newStock);
    setUpdating(true);

    try {
      const res = await fetch(`/api/shop/products/${productId}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock: newStock }),
      });

      setUpdating(false);
      if (!res.ok) {
        // โรลแบ็กสเตทหากมีข้อผิดพลาด
        setStock(prevStock);
      } else {
        // โหลดข้อมูลหน้าใหม่เพื่ออัปเดตสถิติและ badge สถานะ
        router.refresh();
      }
    } catch (err) {
      setUpdating(false);
      setStock(prevStock);
    }
  };

  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* ปุ่มลดสต็อก */}
      <button
        type="button"
        onClick={() => updateStock(stock - 1)}
        disabled={updating || stock <= 0}
        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-400 flex items-center justify-center transition shadow-sm text-slate-500 font-semibold cursor-pointer"
        title="ลดสต็อกลง 1 ชิ้น"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* จำนวนสต็อกปัจจุบัน */}
      <div className="relative w-10 text-center font-mono font-bold text-slate-800 text-sm">
        {updating ? (
          <span className="flex justify-center items-center">
            <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
          </span>
        ) : (
          <span className={stock === 0 ? "text-rose-600" : ""}>{stock}</span>
        )}
      </div>

      {/* ปุ่มเพิ่มสต็อก */}
      <button
        type="button"
        onClick={() => updateStock(stock + 1)}
        disabled={updating}
        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-400 flex items-center justify-center transition shadow-sm text-slate-500 font-semibold cursor-pointer"
        title="เพิ่มสต็อก 1 ชิ้น"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
