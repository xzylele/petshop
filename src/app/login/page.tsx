"use client";

// หน้าเข้าสู่ระบบ: เรียก NextAuth signIn

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ส่งข้อมูลล็อกอินไปยัง Credentials provider
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">เข้าสู่ระบบ</h1>
        <p className="mb-6 text-sm text-slate-600">ยินดีต้อนรับกลับ 🐾</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">อีเมล</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          ยังไม่มีบัญชี? <Link href="/register" className="text-brand-700 hover:underline">สมัครสมาชิก</Link>
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold">บัญชีทดสอบ:</p>
          <p>admin@pets.shop / admin1234</p>
          <p>shop@pets.shop / shop1234</p>
          <p>customer@pets.shop / customer1234</p>
        </div>
      </div>
    </div>
  );
}
