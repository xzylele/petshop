"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown, 
  RotateCcw
} from "lucide-react";
import { formatTHB } from "@/lib/utils";

const ANIMAL_TYPES_WITH_EMOJIS = [
  { name: "สุนัข", emoji: "🐶" },
  { name: "แมว", emoji: "🐱" },
  { name: "นก", emoji: "🐦" },
  { name: "ปลา", emoji: "🐟" },
  { name: "กระต่าย", emoji: "🐰" },
  { name: "สัตว์เลื้อยคลาน", emoji: "🦎" },
  { name: "สัตว์ฟันแทะ", emoji: "🐹" },
  { name: "สัตว์แปลก", emoji: "🦄" }
];

const GENDER_OPTIONS = [
  { value: "ผู้", label: "🚹 เพศผู้ (ผู้)" },
  { value: "เมีย", label: "🚺 เพศเมีย (เมีย)" }
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "🟢 เปิดขาย (Active)" },
  { value: "RESERVED", label: "🔵 จองแล้ว (Reserved)" },
  { value: "SOLD", label: "⚫ ขายแล้ว (Sold)" }
];

const SORT_OPTIONS = [
  { value: "newest", label: "ลงทะเบียนล่าสุด" },
  { value: "price_asc", label: "ราคา: ต่ำสุด -> สูงสุด" },
  { value: "price_desc", label: "ราคา: สูงสุด -> ต่ำสุด" },
  { value: "age_asc", label: "อายุ: น้อยที่สุด -> มากที่สุด" },
  { value: "age_desc", label: "อายุ: มากที่สุด -> น้อยที่สุด" }
];

export default function AnimalFilters({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ดึงค่าจาก URL
  const currentQ = searchParams.get("q") || "";
  const currentType = searchParams.get("type") || "";
  const currentGender = searchParams.get("gender") || "";
  const currentStatus = searchParams.get("status") || "ACTIVE";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentExotic = searchParams.get("exotic") === "1";
  const currentSort = searchParams.get("sort") || "newest";

  // State ท้องถิ่น
  const [q, setQ] = useState(currentQ);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Sync state ท้องถิ่นเมื่อ URL เปลี่ยนแปลง
  useEffect(() => {
    setQ(currentQ);
    setMinPrice(currentMinPrice);
    setMaxPrice(currentMaxPrice);
  }, [currentQ, currentMinPrice, currentMaxPrice]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    // หากไม่ได้ระบุสถานะ ให้ดีฟอลต์เป็น ACTIVE เสมอเพื่อไม่ให้เห็นสัตว์ที่ขายแล้วโดยไม่จำเป็น
    if (!params.has("status") && !updates.hasOwnProperty("status")) {
      params.set("status", "ACTIVE");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ q });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ minPrice, maxPrice });
  };

  const handleClearAll = () => {
    setQ("");
    setMinPrice("");
    setMaxPrice("");
    // รีเซ็ตกลับไปเป็นแสดงสถานะ ACTIVE
    router.push(`${pathname}?status=ACTIVE`);
  };

  const removeFilter = (key: string) => {
    if (key === "q") setQ("");
    if (key === "minPrice") setMinPrice("");
    if (key === "maxPrice") setMaxPrice("");
    updateQuery({ [key]: null });
  };

  const hasActiveFilters = !!(
    currentQ || 
    currentType || 
    currentGender || 
    currentStatus !== "ACTIVE" || 
    currentMinPrice || 
    currentMaxPrice || 
    currentExotic || 
    currentSort !== "newest"
  );

  return (
    <div className="space-y-6">
      {/* ส่วนค้นหาและจัดเรียงแถวบนสุด */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-xl">
          <input 
            type="text" 
            placeholder="ค้นหาชื่อสัตว์เลี้ยง สายพันธุ์ หรือข้อมูล..." 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition"
          />
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <button 
            type="submit" 
            className="absolute right-2 top-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs rounded-lg px-4 py-1.5 transition"
          >
            ค้นหา
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* เรียงตาม */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> เรียงตาม:
            </span>
            <select
              value={currentSort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ปุ่มตัวกรองบน Mobile */}
          <button
            type="button"
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2.5 transition text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            ตัวกรองเพิ่มเติม
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-600 transition px-3 py-1.5 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-rose-50/20"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* สรุปตัวกรอง Active */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">กำลังกรองข้อมูล:</span>
          {currentQ && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              คำค้น: "{currentQ}"
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => removeFilter("q")} />
            </span>
          )}
          {currentType && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              ประเภท: {currentType}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => updateQuery({ type: null })} />
            </span>
          )}
          {currentGender && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              เพศ: {currentGender === "ผู้" ? "ผู้ 🚹" : "เมีย 🚺"}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => updateQuery({ gender: null })} />
            </span>
          )}
          {currentStatus !== "ACTIVE" && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              สถานะ: {currentStatus === "RESERVED" ? "จองแล้ว 🔵" : currentStatus === "SOLD" ? "ขายแล้ว ⚫" : "เปิดขาย 🟢"}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => updateQuery({ status: "ACTIVE" })} />
            </span>
          )}
          {currentExotic && (
            <span className="badge bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              เฉพาะสัตว์แปลก 🦄
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => updateQuery({ exotic: null })} />
            </span>
          )}
          {(currentMinPrice || currentMaxPrice) && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              ราคา: {currentMinPrice ? `${formatTHB(parseFloat(currentMinPrice))}` : "0"} - {currentMaxPrice ? `${formatTHB(parseFloat(currentMaxPrice))}` : "ไม่จำกัด"}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => { removeFilter("minPrice"); removeFilter("maxPrice"); }} />
            </span>
          )}
        </div>
      )}

      {/* แถบตัวกรองและ Grid แสดงผล */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className={`lg:w-64 shrink-0 lg:block ${isOpenMobile ? "block" : "hidden"} space-y-5`}>
          
          {/* กล่องตัวกรองสวิตช์สัตว์แปลก */}
          <div className="card p-4 bg-white">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                🦄 กรองเฉพาะสัตว์แปลก (Exotic)
              </span>
              <input
                type="checkbox"
                checked={currentExotic}
                onChange={(e) => updateQuery({ exotic: e.target.checked ? "1" : null })}
                className="h-4 w-4 rounded border-slate-350 text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>

          {/* กล่องตัวกรองแยกประเภทสัตว์ */}
          <div className="card p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-3 border-b border-slate-100">
              🦁 หมวดหมู่สัตว์เลี้ยง
            </h3>
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateQuery({ type: null })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition text-left border ${
                  !currentType 
                    ? "bg-brand-50 text-brand-700 border-brand-200/50" 
                    : "bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span>📦 ทั้งหมด</span>
              </button>
              {ANIMAL_TYPES_WITH_EMOJIS.map((ani) => {
                const isSelected = currentType === ani.name;
                return (
                  <button
                    key={ani.name}
                    type="button"
                    onClick={() => updateQuery({ type: isSelected ? null : ani.name })}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left border ${
                      isSelected
                        ? "bg-brand-50 text-brand-700 border-brand-200/50 font-bold"
                        : "bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{ani.emoji}</span>
                      <span>{ani.name}</span>
                    </span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-600"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* กรองตามสถานะการจอง/ขาย */}
          <div className="card p-5 bg-white space-y-3">
            <h3 className="text-sm font-bold text-slate-800 pb-2.5 border-b border-slate-100">
              🟢 สถานะสินค้าสัตว์เลี้ยง
            </h3>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = currentStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateQuery({ status: opt.value })}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      isSelected 
                        ? "bg-brand-50 text-brand-700 border-brand-200" 
                        : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* กรองตามเพศ */}
          <div className="card p-5 bg-white space-y-3">
            <h3 className="text-sm font-bold text-slate-800 pb-2.5 border-b border-slate-100">
              👫 เพศสัตว์เลี้ยง
            </h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => updateQuery({ gender: null })}
                className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  !currentGender 
                    ? "bg-brand-50 text-brand-700 border-brand-200" 
                    : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                }`}
              >
                👥 ทั้งหมด
              </button>
              {GENDER_OPTIONS.map((opt) => {
                const isSelected = currentGender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateQuery({ gender: opt.value })}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      isSelected 
                        ? "bg-brand-50 text-brand-700 border-brand-200" 
                        : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* กล่องตัวกรองราคา */}
          <div className="card p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-3 border-b border-slate-100">
              💵 ราคาจำหน่าย
            </h3>
            <form onSubmit={handlePriceSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold font-mono">฿</span>
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <span className="text-slate-400 text-xs font-semibold">ถึง</span>
                <div className="relative flex-grow">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold font-mono">฿</span>
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl py-2 transition shadow-sm"
              >
                กรองราคา
              </button>
            </form>
          </div>
        </aside>

        {/* ผลลัพธ์แสดงสัตว์เลี้ยง */}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
}
