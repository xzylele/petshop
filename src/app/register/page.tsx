"use client";

// หน้าสมัครสมาชิก: ส่งข้อมูลไป API /api/register

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "SHOP_OWNER"
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ส่งข้อมูลสมัครสมาชิกแล้วล็อกอินอัตโนมัติ
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "สมัครสมาชิกไม่สำเร็จ");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">สมัครสมาชิก</h1>
        <p className="mb-6 text-sm text-slate-600">เริ่มต้นช้อปสำหรับเพื่อนสี่ขาของคุณ</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">ชื่อ-นามสกุล</label>
            <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label className="label">อีเมล</label>
            <input type="email" className="input" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className="label">เบอร์โทร</label>
            <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
            <input type="password" className="input" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>
          <div>
            <label className="label">ประเภทบัญชี</label>
            <select className="input" value={form.role} onChange={(e) => update("role", e.target.value as "CUSTOMER" | "SHOP_OWNER")}>
              <option value="CUSTOMER">ลูกค้า</option>
              <option value="SHOP_OWNER">เจ้าของร้านค้า</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">บัญชีร้านค้าจะรอการตรวจสอบจากผู้ดูแลระบบ</p>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          มีบัญชีอยู่แล้ว? <Link href="/login" className="text-brand-700 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
