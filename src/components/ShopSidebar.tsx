"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList, 
  Calendar, 
  Settings,
  Store,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

const menuItems: MenuItem[] = [
  { href: "/shop/dashboard", label: "แดชบอร์ดร้าน", icon: LayoutDashboard },
  { href: "/shop/products", label: "จัดการสินค้า/สัตว์", icon: ShoppingBag },
  { href: "/shop/orders", label: "รายการสั่งซื้อ", icon: ClipboardList },
  { href: "/shop/bookings", label: "รายการจองคิว", icon: Calendar },
  { href: "/shop/profile", label: "ตั้งค่าข้อมูลร้าน", icon: Settings },
];

interface ShopSidebarProps {
  shopName?: string;
  shopStatus?: string;
}

export default function ShopSidebar({ shopName, shopStatus }: ShopSidebarProps) {
  const pathname = usePathname();

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> เปิดบริการ
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="w-3 h-3" /> รออนุมัติ
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-3 h-3" /> ระงับ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {shopName && (
        <div className="px-3 py-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border border-brand-200/50">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm truncate max-w-[180px]">{shopName}</div>
            <div className="text-xs text-slate-400 mt-0.5">ผู้ประกอบการ</div>
          </div>
          <div className="mt-1">
            {getStatusBadge(shopStatus)}
          </div>
        </div>
      )}

      <nav className="space-y-1.5">
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          ผู้ควบคุมร้านค้า
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/shop/dashboard" && pathname.startsWith(item.href));

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
    </div>
  );
}
