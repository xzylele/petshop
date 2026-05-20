"use client";

// ปุ่มควบคุมจำนวน/ลบรายการในตะกร้า

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CartActions({ itemId, quantity, canChangeQty }: { itemId: string; quantity: number; canChangeQty: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // เรียก API เพื่ออัปเดตจำนวนสินค้า
  async function updateQty(next: number) {
    if (next < 1) return remove();
    setBusy(true);
    await fetch(`/api/cart/${itemId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: next }) });
    setBusy(false);
    router.refresh();
  }

  // เรียก API เพื่อลบรายการออกจากตะกร้า
  async function remove() {
    setBusy(true);
    await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      {canChangeQty ? (
        <>
          <button disabled={busy} onClick={() => updateQty(quantity - 1)} className="rounded border border-slate-300 px-2 text-lg">−</button>
          <span className="min-w-[2ch] text-center">{quantity}</span>
          <button disabled={busy} onClick={() => updateQty(quantity + 1)} className="rounded border border-slate-300 px-2 text-lg">+</button>
        </>
      ) : (
        <span className="text-xs text-slate-500">จำนวน: 1</span>
      )}
      <button disabled={busy} onClick={remove} className="ml-auto text-sm text-red-600 hover:underline">ลบ</button>
    </div>
  );
}
