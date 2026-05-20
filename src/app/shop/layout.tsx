// เลย์เอาต์หลังบ้านร้านค้า พร้อมเมนูด้านข้าง
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// บังคับสิทธิ์เฉพาะเจ้าของร้าน/พนักงาน/แอดมิน
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/shop/dashboard");
  if (session.user.role !== "SHOP_OWNER" && session.user.role !== "SHOP_STAFF" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="card sticky top-20 space-y-1 p-3">
          <SideLink href="/shop/dashboard">📊 ภาพรวม</SideLink>
          <SideLink href="/shop/products">📦 สินค้า</SideLink>
          <SideLink href="/shop/orders">📋 คำสั่งซื้อ</SideLink>
          <SideLink href="/shop/profile">⚙️ ตั้งค่าร้าน</SideLink>
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ลิงก์เมนูใน sidebar ร้านค้า
function SideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
      {children}
    </Link>
  );
}
