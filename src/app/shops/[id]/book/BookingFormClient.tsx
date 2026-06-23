"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SERVICES = [
  { value: "GROOMING", label: "✂️ อาบน้ำตัดขน (Grooming)", basePrice: 350, description: "คิดตามน้ำหนัก (<=5กก: 350 บ. | 5-15กก: 500 บ. | >15กก: 650 บ.)" },
  { value: "SPA", label: "🛁 สปาสัตว์เลี้ยง (Pet Spa)", basePrice: 450, description: "คิดตามน้ำหนัก (<=5กก: 450 บ. | 5-15กก: 600 บ. | >15กก: 750 บ.)" },
  { value: "PET_HOTEL", label: "🏨 รับฝากเลี้ยง (Pet Hotel)", basePrice: 500, description: "คิดตามจำนวนวัน (วันละ 500 บาท ห้องแอร์ สะอาด ปลอดภัย)" }
];

interface Props {
  shopId: string;
  allowsGrooming: boolean;
  allowsBoarding: boolean;
}

export default function BookingFormClient({ shopId, allowsGrooming, allowsBoarding }: Props) {
  const router = useRouter();

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

  // คำนวณราคาแบบเรียลไทม์ฝั่ง Client
  let calculatedPrice = 0;
  let calculatedDays = 1;

  if (serviceType === "GROOMING" || serviceType === "SPA") {
    const base = serviceType === "GROOMING" ? 350 : 450;
    const weight = Number(petWeight) || 0;
    if (weight <= 5) {
      calculatedPrice = base;
    } else if (weight <= 15) {
      calculatedPrice = base + 150;
    } else {
      calculatedPrice = base + 300;
    }
  } else if (serviceType === "PET_HOTEL") {
    if (dateTime && checkOutDateTime) {
      const checkIn = new Date(dateTime);
      const checkOut = new Date(checkOutDateTime);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      calculatedDays = diffDays > 0 ? diffDays : 1;
    }
    calculatedPrice = calculatedDays * 500;
  }

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
      if (!checkOutDateTime) {
        setError("กรุณาเลือกวันและเวลาที่มารับสัตว์เลี้ยงกลับ (เช็คเอาต์)");
        return;
      }
      const checkIn = new Date(dateTime);
      const checkOut = new Date(checkOutDateTime);
      if (checkOut <= checkIn) {
        setError("วันเช็คเอาต์ต้องเป็นเวลาหลังจากเช็คอิน");
        return;
      }
    } else {
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
          checkOutDateTime: serviceType === "PET_HOTEL" ? checkOutDateTime : null,
          days: serviceType === "PET_HOTEL" ? calculatedDays : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการจอง");
      }

      router.push("/profile");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* เลือกบริการ */}
      <div>
        <label className="block text-sm font-semibold text-slate-700">เลือกบริการ</label>
        <div className="mt-2 space-y-2">
          {availableServices.map((s) => (
            <label
              key={s.value}
              className={`block cursor-pointer rounded-lg border p-3 transition hover:bg-slate-50 ${
                serviceType === s.value
                  ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500"
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
                    onChange={() => setServiceType(s.value)}
                    className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">{s.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
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
          <label className="block text-sm font-semibold text-slate-700" htmlFor="petName">
            ชื่อสัตว์เลี้ยง
          </label>
          <input
            id="petName"
            type="text"
            required
            placeholder="เช่น ปุยฝ้าย, มะตูม"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>

        {/* ประเภทสัตว์เลี้ยง */}
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="petType">
            ประเภทสัตว์เลี้ยง
          </label>
          <select
            id="petType"
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            className="input mt-1 w-full"
          >
            <option value="สุนัข">สุนัข</option>
            <option value="แมว">แมว</option>
            <option value="กระต่าย">กระต่าย</option>
            <option value="นก">นก</option>
            <option value="อื่น ๆ">อื่น ๆ</option>
          </select>
        </div>
      </div>

      {/* ถ้าเป็นบริการ Grooming / Spa -> ให้กรอกน้ำหนัก */}
      {(serviceType === "GROOMING" || serviceType === "SPA") && (
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="petWeight">
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
            className="input mt-1 w-full max-w-[200px]"
          />
          <div className="mt-2 text-xs text-slate-500">
            * ระบบจะคำนวณราคาตามขนาดตัวสัตว์เลี้ยง (ขนาดเล็ก: ไม่เกิน 5 กก. | ขนาดกลาง: 5.1 - 15 กก. | ขนาดใหญ่: เกิน 15 กก.)
          </div>
        </div>
      )}

      {/* วันและเวลารับบริการ */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="dateTime">
            {serviceType === "PET_HOTEL" ? "🗓️ วันเช็คอิน (เริ่มฝาก)" : "🗓️ วันและเวลาที่จอง"}
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            required
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>

        {/* ถ้าเป็นฝากเลี้ยง -> เพิ่มเช็คเอาต์ */}
        {serviceType === "PET_HOTEL" && (
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="checkOutDateTime">
              🗓️ วันเช็คเอาต์ (รับกลับ)
            </label>
            <input
              id="checkOutDateTime"
              type="datetime-local"
              required
              value={checkOutDateTime}
              onChange={(e) => setCheckOutDateTime(e.target.value)}
              className="input mt-1 w-full"
            />
          </div>
        )}
      </div>

      {/* โน้ตเพิ่มเติม */}
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="notes">
          ความต้องการเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="ระบุข้อควรระวัง เช่น ไม่ชอบลมร้อน หรือต้องการให้ป้อนยาประจำตัว"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input mt-1 w-full"
        />
      </div>

      <hr className="border-slate-100" />

      {/* สรุปราคา */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
        <div>
          <span className="text-xs text-slate-500">
            {serviceType === "PET_HOTEL" ? `สรุปเวลาจองฝากเลี้ยง (ทั้งหมด ${calculatedDays} วัน)` : "สรุปราคาบริการ"}
          </span>
          <p className="text-lg font-bold text-slate-800">
            {serviceType === "GROOMING" && "✂️ อาบน้ำตัดขน"}
            {serviceType === "SPA" && "🛁 สปาสัตว์เลี้ยง"}
            {serviceType === "PET_HOTEL" && "🏨 บริการรับฝากเลี้ยง"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-brand-600">{calculatedPrice} บาท</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
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
