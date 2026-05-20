// เลย์เอาต์หลังบ้านแอดมิน พร้อมเมนูด้านข้าง
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// บังคับเฉพาะผู้ใช้ role ADMIN
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="card sticky top-20 space-y-1 p-3">
          <Side href="/admin/dashboard">📊 ภาพรวม</Side>
          <Side href="/admin/users">👥 ผู้ใช้</Side>
          <Side href="/admin/shops">🏪 ร้านค้า</Side>
          <Side href="/admin/products">📦 สินค้า</Side>
          <Side href="/admin/animals">🐾 สัตว์</Side>
          <Side href="/admin/farms">🏡 ฟาร์ม</Side>
          <Side href="/admin/orders">📋 คำสั่งซื้อ</Side>
          <Side href="/admin/payments">💳 การชำระเงิน</Side>
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ลิงก์เมนูใน sidebar ของแอดมิน
function Side({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">{children}</Link>;
}
