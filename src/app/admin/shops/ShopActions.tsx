"use client";

// ปุ่มอนุมัติ/ปฏิเสธ/ระงับร้านค้า

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ShopActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // เรียก API เพื่อเปลี่ยนสถานะร้าน
  async function act(action: "approve" | "reject" | "suspend") {
    setBusy(true);
    await fetch(`/api/admin/shops/${id}/${action}`, { method: "PUT" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      {status !== "APPROVED" && <button disabled={busy} onClick={() => act("approve")} className="btn-secondary text-xs">อนุมัติ</button>}
      {status !== "REJECTED" && <button disabled={busy} onClick={() => act("reject")} className="btn-outline text-xs">ปฏิเสธ</button>}
      {status !== "SUSPENDED" && <button disabled={busy} onClick={() => act("suspend")} className="btn-outline text-xs text-red-600 border-red-300">ระงับ</button>}
    </div>
  );
}
