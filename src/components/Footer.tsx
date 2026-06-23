"use client";

import { usePathname } from "next/navigation";

// ส่วนท้ายเว็บไซต์
export default function Footer() {
  const pathname = usePathname();

  if (pathname && (pathname.startsWith("/admin") || pathname.startsWith("/shop"))) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-slate-600 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-brand-700">
            <span className="text-2xl">🐾</span>
            <span className="text-lg font-bold">PetsShop</span>
          </div>
          <p className="mt-2">Marketplace สำหรับคนรักสัตว์ ครบจบในที่เดียว</p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-800">เกี่ยวกับเรา</h3>
          <ul className="space-y-1">
            <li>กฎและเงื่อนไขการใช้งาน</li>
            <li>นโยบายความเป็นส่วนตัว</li>
            <li>การคืนสินค้า</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-800">ติดต่อ</h3>
          <p>support@pets.shop</p>
          <p>02-000-0000</p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PetsShop. All rights reserved.
      </div>
    </footer>
  );
}
