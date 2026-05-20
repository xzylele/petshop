"use client";

// ตัวควบคุมเปลี่ยน role และสถานะผู้ใช้

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["CUSTOMER", "SHOP_OWNER", "SHOP_STAFF", "ADMIN"];
const STATUSES = ["ACTIVE", "SUSPENDED", "PENDING"];

export default function UserActions({ id, role, status }: { id: string; role: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // เรียก API เพื่อเปลี่ยน role
  async function changeRole(next: string) {
    if (next === role) return;
    setBusy(true);
    await fetch(`/api/admin/users/${id}/role`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: next }) });
    setBusy(false);
    router.refresh();
  }

  // เรียก API เพื่อเปลี่ยนสถานะผู้ใช้
  async function changeStatus(next: string) {
    if (next === status) return;
    setBusy(true);
    await fetch(`/api/admin/users/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <select disabled={busy} className="input w-32" value={role} onChange={(e) => changeRole(e.target.value)}>
        {ROLES.map((r) => <option key={r}>{r}</option>)}
      </select>
      <select disabled={busy} className="input w-32" value={status} onChange={(e) => changeStatus(e.target.value)}>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
    </div>
  );
}
