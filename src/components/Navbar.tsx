"use client";

// แถบนำทางหลัก พร้อมเมนูผู้ใช้ตามบทบาท

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);

  const isShopAdmin = pathname && (pathname === "/shop" || pathname.startsWith("/shop/"));
  if (pathname && (pathname.startsWith("/admin") || isShopAdmin)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold text-brand-700">PetsShop</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/products" label="สินค้า" />
          <NavLink href="/animals" label="สัตว์เลี้ยง" />
          <NavLink href="/farms" label="ฟาร์ม" />
          <NavLink href="/shops" label="ร้านค้า" />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/cart" className="btn-outline" aria-label="ตะกร้าสินค้า">
            🛒 ตะกร้า
          </Link>
          {user ? (
            <div className="relative">
              <button
                className="btn-secondary"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {user.name ?? user.email} ▾
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <DropItem href="/profile" onClick={() => setOpen(false)}>โปรไฟล์</DropItem>
                  <DropItem href="/orders" onClick={() => setOpen(false)}>คำสั่งซื้อของฉัน</DropItem>
                  <DropItem href="/bookings" onClick={() => setOpen(false)}>การจองคิวของฉัน</DropItem>
                  {(user.role === "SHOP_OWNER" || user.role === "SHOP_STAFF" || user.role === "ADMIN") && (
                    <DropItem href="/shop/dashboard" onClick={() => setOpen(false)}>หลังบ้านร้านค้า</DropItem>
                  )}
                  {user.role === "ADMIN" && (
                    <DropItem href="/admin/dashboard" onClick={() => setOpen(false)}>ผู้ดูแลระบบ</DropItem>
                  )}
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-outline">เข้าสู่ระบบ</Link>
              <Link href="/register" className="btn-primary">สมัครสมาชิก</Link>
            </>
          )}
        </div>

        <button
          className="rounded-md border border-slate-300 p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="เมนู"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          <MobileLink href="/products">สินค้า</MobileLink>
          <MobileLink href="/animals">สัตว์เลี้ยง</MobileLink>
          <MobileLink href="/farms">ฟาร์ม</MobileLink>
          <MobileLink href="/shops">ร้านค้า</MobileLink>
          <MobileLink href="/cart">ตะกร้า</MobileLink>
          {user ? (
            <>
              <MobileLink href="/profile">โปรไฟล์</MobileLink>
              <MobileLink href="/orders">คำสั่งซื้อ</MobileLink>
              <MobileLink href="/bookings">การจองคิว</MobileLink>
              {(user.role === "SHOP_OWNER" || user.role === "SHOP_STAFF") && <MobileLink href="/shop/dashboard">หลังบ้านร้านค้า</MobileLink>}
              {user.role === "ADMIN" && <MobileLink href="/admin/dashboard">ผู้ดูแลระบบ</MobileLink>}
              <button
                className="block w-full py-2 text-left text-sm text-red-600"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <MobileLink href="/login">เข้าสู่ระบบ</MobileLink>
              <MobileLink href="/register">สมัครสมาชิก</MobileLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}

// ลิงก์เมนูบนเดสก์ท็อป
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-700">
      {label}
    </Link>
  );
}

// รายการเมนูในดรอปดาวน์ผู้ใช้
function DropItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
      {children}
    </Link>
  );
}

// ลิงก์เมนูบนมือถือ
function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block py-2 text-sm text-slate-700">
      {children}
    </Link>
  );
}
