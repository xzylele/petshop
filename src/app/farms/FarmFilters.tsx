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

const SORT_OPTIONS = [
  { value: "newest", label: "ลงทะเบียนล่าสุด" },
  { value: "name_asc", label: "ชื่อฟาร์ม: ก - ฮ" },
  { value: "name_desc", label: "ชื่อฟาร์ม: ฮ - ก" }
];

interface FarmFiltersProps {
  provinces: string[];
  children?: React.ReactNode;
}

export default function FarmFilters({ provinces, children }: FarmFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ดึงค่าจาก URL
  const currentQ = searchParams.get("q") || "";
  const currentProvince = searchParams.get("province") || "";
  const currentAnimalType = searchParams.get("animalType") || "";
  const currentSort = searchParams.get("sort") || "newest";

  // State ท้องถิ่น
  const [q, setQ] = useState(currentQ);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  useEffect(() => {
    setQ(currentQ);
  }, [currentQ]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ q });
  };

  const handleClearAll = () => {
    setQ("");
    router.push(pathname);
  };

  const removeFilter = (key: string) => {
    if (key === "q") setQ("");
    updateQuery({ [key]: null });
  };

  const hasActiveFilters = !!(currentQ || currentProvince || currentAnimalType || currentSort !== "newest");

  return (
    <div className="space-y-6">
      {/* ส่วนหัวตัวเลือกค้นหาหลักและเรียงตาม */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-xl">
          <input 
            type="text" 
            placeholder="ค้นหาชื่อฟาร์ม ที่อยู่ หรือจังหวัด..." 
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
          {/* จัดเรียงตาม */}
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

          {/* ตัวกรองสำหรับ Mobile */}
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

      {/* สรุปรายการ Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">กำลังกรองข้อมูล:</span>
          {currentQ && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              คำค้น: "{currentQ}"
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => removeFilter("q")} />
            </span>
          )}
          {currentProvince && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              จังหวัด: {currentProvince}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => updateQuery({ province: null })} />
            </span>
          )}
          {currentAnimalType && (
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 flex items-center gap-1 text-xs font-medium">
              เพาะพันธุ์สัตว์: {currentAnimalType}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600 ml-1.5" onClick={() => updateQuery({ animalType: null })} />
            </span>
          )}
        </div>
      )}

      {/* แถบตัวเลือกคัดกรองหลัก */}
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className={`lg:w-64 shrink-0 lg:block ${isOpenMobile ? "block" : "hidden"} space-y-5`}>
          
          {/* กล่องตัวเลือกจังหวัด */}
          <div className="card p-5 bg-white space-y-3">
            <h3 className="text-sm font-bold text-slate-800 pb-2.5 border-b border-slate-100">
              📍 ที่ตั้งจังหวัด
            </h3>
            {provinces.length === 0 ? (
              <p className="text-xs text-slate-400">ไม่พบข้อมูลจังหวัด</p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => updateQuery({ province: null })}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    !currentProvince 
                      ? "bg-brand-50 text-brand-700 border-brand-200" 
                      : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  🗺️ ทุกจังหวัด
                </button>
                {provinces.map((prov) => {
                  const isSelected = currentProvince === prov;
                  return (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => updateQuery({ province: isSelected ? null : prov })}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        isSelected 
                          ? "bg-brand-50 text-brand-700 border-brand-200" 
                          : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                      }`}
                    >
                      จังหวัด{prov}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* กล่องตัวกรองประเภทสัตว์ที่เพาะพันธุ์ */}
          <div className="card p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-3 border-b border-slate-100">
              🧬 กรองตามสัตว์ที่เพาะเลี้ยง
            </h3>
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateQuery({ animalType: null })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition text-left border ${
                  !currentAnimalType 
                    ? "bg-brand-50 text-brand-700 border-brand-200/50" 
                    : "bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span>📦 ทั้งหมด</span>
              </button>
              {ANIMAL_TYPES_WITH_EMOJIS.map((ani) => {
                const isSelected = currentAnimalType === ani.name;
                return (
                  <button
                    key={ani.name}
                    type="button"
                    onClick={() => updateQuery({ animalType: isSelected ? null : ani.name })}
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
        </aside>

        {/* รายการฟาร์ม */}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
}
