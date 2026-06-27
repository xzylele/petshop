"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


interface Props {
  shopId: string;
  allowsGrooming: boolean;
  allowsBoarding: boolean;
  boardingPrice: number;
  groomingPriceSmall: number;
  groomingPriceMedium: number;
  groomingPriceLarge: number;
  spaPriceSmall: number;
  spaPriceMedium: number;
  spaPriceLarge: number;
}

export default function BookingFormClient({
  shopId,
  allowsGrooming,
  allowsBoarding,
  boardingPrice,
  groomingPriceSmall,
  groomingPriceMedium,
  groomingPriceLarge,
  spaPriceSmall,
  spaPriceMedium,
  spaPriceLarge
}: Props) {
  const router = useRouter();

  const SERVICES = [
    {
      value: "GROOMING",
      label: "✂️ อาบน้ำตัดขน (Grooming)",
      basePrice: groomingPriceSmall,
      description: `คิดตามน้ำหนัก (<=5กก: ${groomingPriceSmall} บ. | 5.1-15กก: ${groomingPriceMedium} บ. | >15กก: ${groomingPriceLarge} บ.)`
    },
    {
      value: "SPA",
      label: "🛁 สปาสัตว์เลี้ยง (Pet Spa)",
      basePrice: spaPriceSmall,
      description: `คิดตามน้ำหนัก (<=5กก: ${spaPriceSmall} บ. | 5.1-15กก: ${spaPriceMedium} บ. | >15กก: ${spaPriceLarge} บ.)`
    },
    {
      value: "PET_HOTEL",
      label: "🏨 รับฝากเลี้ยง (Pet Hotel)",
      basePrice: boardingPrice,
      description: `คิดตามจำนวนวัน (วันละ ${boardingPrice} บาท ห้องแอร์ สะอาด ปลอดภัย)`
    }
  ];

  // กรองบริการที่พร้อมใช้งาน
  const availableServices = SERVICES.filter((s) => {
    if (s.value === "GROOMING" || s.value === "SPA") return allowsGrooming;
    if (s.value === "PET_HOTEL") return allowsBoarding;
    return false;
  });

  const defaultService = allowsGrooming ? "GROOMING" : (allowsBoarding ? "PET_HOTEL" : "");

  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("สุนัข");
  const [serviceType, setServiceType] = useState(defaultService);
  const [dateTime, setDateTime] = useState("");
  const [checkOutDateTime, setCheckOutDateTime] = useState("");
  const [petWeight, setPetWeight] = useState("5.0");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ฟังก์ชันช่วยจัดรูปแบบวันที่เป็น YYYY-MM-DD
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // ดึงลิสต์ของ 14 วันถัดไป
  const getNextNDays = (n: number) => {
    const days = [];
    const DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    const MONTHS_SHORT = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    for (let i = 0; i < n; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayLabel: DAYS_SHORT[d.getDay()],
        dateLabel: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
      });
    }
    return days;
  };

  const next14Days = getNextNDays(14);
  const next30Days = getNextNDays(30);

  // States ใหม่สำหรับคิวจองและปฏิทิน
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(0));
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // สำหรับบริการฝากเลี้ยง (Pet Hotel)
  const [checkInDate, setCheckInDate] = useState(getLocalDateString(0));
  const [checkOutDate, setCheckOutDate] = useState(getLocalDateString(1));

  // --- Coupon states ---
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  // โหลดสล็อตเวลา/ความจุเมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (!shopId || !selectedDate || !serviceType) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const queryDate = serviceType === "PET_HOTEL" ? getLocalDateString(0) : selectedDate;
        const res = await fetch(`/api/shops/${shopId}/booking-slots?date=${queryDate}&serviceType=${serviceType}`);
        const data = await res.json();
        if (res.ok) {
          if (data.slots) {
            setSlots(data.slots);
          } else {
            setSlots([]);
          }
          if (data.occupancy) {
            setOccupancy(data.occupancy);
          } else {
            setOccupancy([]);
          }
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [shopId, selectedDate, serviceType]);

  // ตั้งค่า dateTime เมี่อมีการคลิกสล็อตเวลา (สำหรับ Grooming / Spa)
  useEffect(() => {
    if (serviceType !== "PET_HOTEL" && selectedDate && selectedTime) {
      setDateTime(`${selectedDate}T${selectedTime}`);
    }
  }, [selectedDate, selectedTime, serviceType]);

  // ตั้งค่า dateTime และ checkOutDateTime (สำหรับ Pet Hotel)
  useEffect(() => {
    if (serviceType === "PET_HOTEL") {
      setDateTime(`${checkInDate}T12:00`);
      setCheckOutDateTime(`${checkOutDate}T12:00`);
    }
  }, [checkInDate, checkOutDate, serviceType]);

  // คำนวณราคาแบบเรียลไทม์
  let calculatedPrice = 0;
  let calculatedDays = 1;

  // Coupon functions
  async function handleApplyCoupon(code: string, currentPrice?: number) {
    if (!code.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    const priceToCheck = currentPrice !== undefined ? currentPrice : calculatedPrice;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          isBooking: true,
          bookingPrice: priceToCheck,
          shopId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถใช้งานคูปองได้");
      }
      setAppliedCoupon(data);
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
  }

  if (serviceType === "GROOMING") {
    const weight = Number(petWeight) || 0;
    if (weight <= 5) {
      calculatedPrice = groomingPriceSmall;
    } else if (weight <= 15) {
      calculatedPrice = groomingPriceMedium;
    } else {
      calculatedPrice = groomingPriceLarge;
    }
  } else if (serviceType === "SPA") {
    const weight = Number(petWeight) || 0;
    if (weight <= 5) {
      calculatedPrice = spaPriceSmall;
    } else if (weight <= 15) {
      calculatedPrice = spaPriceMedium;
    } else {
      calculatedPrice = spaPriceLarge;
    }
  } else if (serviceType === "PET_HOTEL") {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      calculatedDays = diffDays > 0 ? diffDays : 1;
    }
    calculatedPrice = calculatedDays * boardingPrice;
  }

  // Auto-revalidate coupon if price changes
  useEffect(() => {
    if (appliedCoupon) {
      handleApplyCoupon(appliedCoupon.code, calculatedPrice);
    }
  }, [calculatedPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim()) {
      setError("กรุณากรอกชื่อสัตว์เลี้ยง");
      return;
    }
    if (!dateTime) {
      setError("กรุณาเลือกวันและเวลาเริ่มต้นรับบริการ");
      return;
    }

    if (serviceType === "PET_HOTEL") {
      if (!checkOutDate) {
        setError("กรุณาเลือกวันเช็คเอาต์");
        return;
      }
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (checkOut <= checkIn) {
        setError("วันเช็คเอาต์ต้องเป็นวันหลังจากเช็คอิน");
        return;
      }

      // ตรวจสอบว่ามีวันไหนในอาร์เรย์ occupancy ของช่วงการจองนี้ที่เต็มความจุหรือไม่
      const startT = checkIn.getTime();
      const endT = checkOut.getTime();
      const fullDay = occupancy.find((day) => {
        const dayT = new Date(day.date).getTime();
        return dayT >= startT && dayT <= endT && day.booked >= day.capacity;
      });
      if (fullDay) {
        setError(`ขออภัย วันที่ ${fullDay.date} มีสุนัขเข้าพักเต็มความจุแล้ว (${fullDay.booked}/${fullDay.capacity}) กรุณาเลือกช่วงเวลาอื่น`);
        return;
      }

    } else {
      if (!selectedTime) {
        setError("กรุณาเลือกรอบเวลาบริการ");
        return;
      }
      const weight = Number(petWeight);
      if (isNaN(weight) || weight <= 0) {
        setError("กรุณากรอกน้ำหนักสัตว์เลี้ยงให้ถูกต้อง (มากกว่า 0 กก.)");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          petName,
          petType,
          serviceType,
          dateTime,
          notes,
          petWeight: (serviceType === "GROOMING" || serviceType === "SPA") ? Number(petWeight) : null,
          checkOutDateTime: serviceType === "PET_HOTEL" ? `${checkOutDate}T12:00` : null,
          days: serviceType === "PET_HOTEL" ? calculatedDays : null,
          couponCode: appliedCoupon?.code || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการจอง");
      }

      router.push("/bookings");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (availableServices.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500">
        ขณะนี้ร้านค้านี้ไม่เปิดจองบริการใด ๆ
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
          ⚠️ {error}
        </div>
      )}

      {/* เลือกบริการ */}
      <div>
        <label className="block text-sm font-bold text-slate-800">เลือกบริการ</label>
        <div className="mt-2 space-y-2">
          {availableServices.map((s) => (
            <label
              key={s.value}
              className={`block cursor-pointer rounded-xl border p-4 transition hover:bg-slate-50 ${serviceType === s.value
                  ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500 shadow-sm"
                  : "border-slate-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="serviceType"
                    value={s.value}
                    checked={serviceType === s.value}
                    onChange={() => {
                      setServiceType(s.value);
                      setSelectedTime("");
                    }}
                    className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{s.label}</span>
                    <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ชื่อสัตว์เลี้ยง */}
        <div>
          <label className="block text-sm font-bold text-slate-800" htmlFor="petName">
            ชื่อสัตว์เลี้ยง
          </label>
          <input
            id="petName"
            type="text"
            required
            placeholder="เช่น ปุยฝ้าย, มะตูม"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            className="input mt-1 w-full rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-500"
          />
        </div>

        {/* ประเภทสัตว์เลี้ยง */}
        <div>
          <label className="block text-sm font-bold text-slate-800" htmlFor="petType">
            ประเภทสัตว์เลี้ยง
          </label>
          <select
            id="petType"
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            className="input mt-1 w-full rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-500"
          >
            <option value="สุนัข">🐶 สุนัข</option>
            <option value="แมว">🐱 แมว</option>
            <option value="กระต่าย">🐰 กระต่าย</option>
            <option value="นก">🦜 นก</option>
            <option value="อื่น ๆ">🐾 อื่น ๆ</option>
          </select>
        </div>
      </div>

      {/* ถ้าเป็นบริการ Grooming / Spa -> ให้กรอกน้ำหนัก */}
      {(serviceType === "GROOMING" || serviceType === "SPA") && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <label className="block text-sm font-bold text-slate-800" htmlFor="petWeight">
            น้ำหนักตัวสัตว์เลี้ยง (กิโลกรัม)
          </label>
          <input
            id="petWeight"
            type="number"
            step="0.1"
            min="0.1"
            required
            value={petWeight}
            onChange={(e) => setPetWeight(e.target.value)}
            className="input mt-1 w-full max-w-[200px] rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-500"
          />
          <div className="mt-2 text-xs text-slate-500">
            * ระบบจะคำนวณราคาตามขนาดตัวสัตว์เลี้ยง (ขนาดเล็ก: ไม่เกิน 5 กก. | ขนาดกลาง: 5.1 - 15 กก. | ขนาดใหญ่: เกิน 15 กก.)
          </div>
        </div>
      )}

      {/* ระบบปฏิทินแบบ Interactive สำหรับอาบน้ำตัดขน/สปา */}
      {(serviceType === "GROOMING" || serviceType === "SPA") && (
        <div className="space-y-4">
          {/* เลือกวันที่ */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">🗓️ เลือกวันที่ต้องการจอง</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {next14Days.map((day) => {
                const isSelected = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setSelectedTime("");
                    }}
                    className={`flex flex-col items-center justify-center p-3 min-w-[76px] rounded-xl border transition-all ${isSelected
                        ? "border-brand-500 bg-brand-500 text-white font-bold shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                  >
                    <span className={`text-[10px] uppercase ${isSelected ? "text-brand-100" : "text-slate-400"}`}>
                      {day.dayLabel}
                    </span>
                    <span className="text-sm mt-1">{day.dateLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* เลือกรอบเวลา */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">⏰ เลือกรอบเวลาบริการ</label>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                <svg className="animate-spin h-5 w-5 mr-2 text-brand-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังโหลดช่วงเวลาที่ว่าง...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  const isAvailable = slot.available;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${isSelected
                          ? "border-brand-600 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-500"
                          : !isAvailable
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                    >
                      <span className="font-semibold">{slot.time} น.</span>
                      <span className={`text-[10px] mt-0.5 ${!isAvailable ? "text-red-400" : isSelected ? "text-brand-600" : "text-slate-400"}`}>
                        {isAvailable ? `ว่าง ${slot.capacity - slot.booked}/${slot.capacity}` : "เต็ม"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ระบบปฏิทินแบบ Interactive สำหรับ Pet Hotel */}
      {serviceType === "PET_HOTEL" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* วันเช็คอิน */}
            <div>
              <label className="block text-sm font-bold text-slate-800" htmlFor="checkInDate">
                🗓️ วันเช็คอิน (เริ่มฝาก)
              </label>
              <select
                id="checkInDate"
                value={checkInDate}
                onChange={(e) => {
                  setCheckInDate(e.target.value);
                  // ปรับปรุงวันเช็คเอาต์อัตโนมัติให้ห่างกันอย่างน้อย 1 วัน
                  const checkIn = new Date(e.target.value);
                  checkIn.setDate(checkIn.getDate() + 1);
                  const y = checkIn.getFullYear();
                  const m = String(checkIn.getMonth() + 1).padStart(2, "0");
                  const d = String(checkIn.getDate()).padStart(2, "0");
                  setCheckOutDate(`${y}-${m}-${d}`);
                }}
                className="input mt-1 w-full rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-500"
              >
                {next30Days.slice(0, 29).map((d) => {
                  const dayData = occupancy.find((day) => day.date === d.dateStr);
                  const bookedCount = dayData ? dayData.booked : 0;
                  const capacity = dayData ? dayData.capacity : 5;
                  const isFull = bookedCount >= capacity;
                  return (
                    <option key={d.dateStr} value={d.dateStr} disabled={isFull}>
                      {d.dateLabel} {isFull ? "(เต็ม)" : `(ว่าง ${capacity - bookedCount} ห้อง)`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* วันเช็คเอาต์ */}
            <div>
              <label className="block text-sm font-bold text-slate-800" htmlFor="checkOutDate">
                🗓️ วันเช็คเอาต์ (รับกลับ)
              </label>
              <select
                id="checkOutDate"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="input mt-1 w-full rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-500"
              >
                {next30Days.map((d) => {
                  const isBeforeCheckIn = new Date(d.dateStr) <= new Date(checkInDate);
                  if (isBeforeCheckIn) return null;
                  const dayData = occupancy.find((day) => day.date === d.dateStr);
                  const bookedCount = dayData ? dayData.booked : 0;
                  const capacity = dayData ? dayData.capacity : 5;
                  const isFull = bookedCount >= capacity;
                  return (
                    <option key={d.dateStr} value={d.dateStr} disabled={isFull}>
                      {d.dateLabel} {isFull ? "(เต็ม)" : `(ว่าง ${capacity - bookedCount} ห้อง)`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* แผนที่แสดงสถานะห้องว่าง 30 วันข้างหน้า */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              สถานะห้องว่าง โรงแรมสัตว์เลี้ยง (30 วันข้างหน้า)
            </h4>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                กำลังอัปเดตห้องว่าง...
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {occupancy.map((day) => {
                  const checkInT = new Date(checkInDate).getTime();
                  const checkOutT = new Date(checkOutDate).getTime();
                  const dayT = new Date(day.date).getTime();
                  const isSelectedDay = dayT >= checkInT && dayT < checkOutT;

                  const booked = day.booked;
                  const capacity = day.capacity;
                  const ratio = booked / capacity;
                  let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200"; // ว่างเยอะ
                  if (booked >= capacity) {
                    colorClass = "bg-rose-50 text-rose-700 border-rose-200"; // เต็ม
                  } else if (ratio >= 0.6) {
                    colorClass = "bg-amber-50 text-amber-700 border-amber-200"; // เริ่มแน่น
                  }

                  return (
                    <div
                      key={day.date}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] text-center ${colorClass} ${isSelectedDay ? "ring-2 ring-brand-500 scale-105 font-bold shadow-sm" : ""
                        }`}
                    >
                      <span className="font-semibold">{day.date.split("-")[2]}</span>
                      <span className="scale-90 opacity-85">{booked}/{capacity}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-4 mt-3 text-[10px] text-slate-500 justify-end">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-200 rounded-sm"></span> ว่างเยอะ</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-50 border border-amber-200 rounded-sm"></span> ใกล้เต็ม</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-50 border border-rose-200 rounded-sm"></span> เต็มแล้ว</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 ring-2 ring-brand-500 rounded-sm bg-white"></span> วันที่เลือก</span>
            </div>
          </div>
        </div>
      )}

      {/* โน้ตเพิ่มเติม */}
      <div>
        <label className="block text-sm font-bold text-slate-800" htmlFor="notes">
          ความต้องการเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="ระบุข้อควรระวัง เช่น ไม่ชอบลมร้อน หรือต้องการให้ป้อนยาประจำตัว"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input mt-1 w-full rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-500"
        />
      </div>

      {/* ส่วนลด/คูปองบริการ */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 uppercase">🎟️ คูปองส่วนลดบริการ</label>

        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-3 py-2.5 rounded-xl border border-emerald-200 text-xs">
            <span className="font-bold uppercase flex items-center gap-1.5">
              🎟️ {appliedCoupon.code} (ลด -{appliedCoupon.discount} บาท)
            </span>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-rose-600 hover:text-rose-800 font-bold"
            >
              ลบออก
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="กรอกโค้ดส่วนลดบริการ (เช่น SERVICE50)"
                value={couponCodeInput}
                onChange={(e) => {
                  setCouponCodeInput(e.target.value.toUpperCase());
                  setCouponError("");
                }}
                className="input text-xs w-full rounded-xl border-slate-200 uppercase"
              />
              <button
                type="button"
                disabled={validatingCoupon || !couponCodeInput.trim()}
                onClick={() => handleApplyCoupon(couponCodeInput)}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 rounded-xl shrink-0 transition"
              >
                {validatingCoupon ? "กำลังตรวจ..." : "ใช้โค้ด"}
              </button>
            </div>
            {couponError && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                ⚠️ {couponError}
              </p>
            )}
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* สรุปราคา */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-4">
        <div>
          <span className="text-xs text-slate-500">
            {serviceType === "PET_HOTEL" ? `สรุปเวลาจองฝากเลี้ยง (ทั้งหมด ${calculatedDays} วัน)` : "สรุปราคาบริการ"}
          </span>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {serviceType === "GROOMING" && "✂️ อาบน้ำตัดขน"}
            {serviceType === "SPA" && "🛁 สปาสัตว์เลี้ยง"}
            {serviceType === "PET_HOTEL" && "🏨 บริการรับฝากเลี้ยง"}
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          {appliedCoupon ? (
            <>
              <span className="text-xs text-slate-400 line-through">{calculatedPrice} บาท</span>
              <span className="text-2xl font-black text-brand-600">
                {Math.max(0, calculatedPrice - appliedCoupon.discount)} บาท
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">ประหยัดไป {appliedCoupon.discount} บาท</span>
            </>
          ) : (
            <span className="text-2xl font-black text-brand-600">{calculatedPrice} บาท</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 rounded-xl"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            กำลังส่งข้อมูล...
          </>
        ) : (
          "ยืนยันการจองคิวบริการ"
        )}
      </button>
    </form>
  );
}
