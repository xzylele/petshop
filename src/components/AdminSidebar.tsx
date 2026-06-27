"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingBag, 
  PawPrint, 
  Home, 
  ClipboardList, 
  CreditCard,
  Image as ImageIcon,
  Ticket
} from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

const menuItems: MenuItem[] = [
  { href: "/admin/dashboard", label: "ภาพรวมระบบ", icon: LayoutDashboard },
  { href: "/admin/users", label: "จัดการผู้ใช้", icon: Users },
  { href: "/admin/shops", label: "จัดการร้านค้า", icon: Store },
  { href: "/admin/banners", label: "จัดการแบนเนอร์", icon: ImageIcon },
  { href: "/admin/coupons", label: "จัดการคูปอง", icon: Ticket },
  { href: "/admin/products", label: "จัดการสินค้า", icon: ShoppingBag },
  { href: "/admin/animals", label: "จัดการสัตว์เลี้ยง", icon: PawPrint },
  { href: "/admin/farms", label: "จัดการฟาร์ม", icon: Home },
  { href: "/admin/orders", label: "คำสั่งซื้อทั้งหมด", icon: ClipboardList },
  { href: "/admin/payments", label: "ตรวจสลิปชำระเงิน", icon: CreditCard },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5 py-2">
      <div className="px-3 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        การจัดการระบบ
      </div>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-brand-50 text-brand-700 shadow-sm shadow-brand-100/50 border-l-4 border-brand-600 pl-3"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent"
            }`}
          >
            <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
