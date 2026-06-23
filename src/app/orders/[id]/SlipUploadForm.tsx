"use client";

// ฟอร์มอัปโหลดสลิปสำหรับคำสั่งซื้อ พร้อมตัวสร้างสลิปจำลอง
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { 
  UploadCloud, 
  Sparkles, 
  Link2, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { formatTHB } from "@/lib/utils";

interface SlipUploadFormProps {
  orderId: string;
  amount: number;
}

export default function SlipUploadForm({ orderId, amount }: SlipUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [slipUrl, setSlipUrl] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // การทำงานของ File Upload: อ่านเป็น Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSlipUrl(reader.result);
        setMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // สร้างสลิปจำลองอัตโนมัติด้วย HTML5 Canvas
  const handleGenerateMockSlip = () => {
    setMsg(null);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 560;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. วาดพื้นหลัง Gradient นุ่มๆ สไตล์ KBank/PromptPay
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 560);
    bgGrad.addColorStop(0, "#064e3b"); // เขียวมรกตเข้ม
    bgGrad.addColorStop(0.15, "#0f766e"); // เขียวแกมน้ำเงิน
    bgGrad.addColorStop(0.5, "#f8fafc"); // ขาวเทา
    bgGrad.addColorStop(1, "#f1f5f9"); // เทานุ่ม
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 560);

    // 2. วาดบานหน้าต่างข้อมูล (Card body inside)
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    // วาดแบบขอบมน
    ctx.beginPath();
    ctx.roundRect(20, 60, 360, 475, 16);
    ctx.fill();
    ctx.shadowColor = "transparent"; // Reset shadow

    // 3. วาดโลโก้/ข้อความหัวกระดาษสลิป
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PetsShop Marketplace", 200, 38);

    ctx.fillStyle = "#0f766e";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("โอนเงินสำเร็จ", 200, 105);

    // วันที่-เวลา
    const now = new Date();
    const dateStr = now.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    const timeStr = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${dateStr} · ${timeStr}`, 200, 128);

    // เส้นคั่นประดับ
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, 145);
    ctx.lineTo(360, 145);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 4. รายละเอียดธุรกรรม
    ctx.textAlign = "left";
    
    // ผู้โอน (จาก)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.fillText("จาก", 45, 175);
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("คุณลูกค้า (Customer Account)", 45, 194);
    ctx.fillStyle = "#64748b";
    ctx.font = "11px sans-serif";
    ctx.fillText("ธนาคารจำลองผ่านแอป", 45, 210);

    // ผู้รับ (ไปยัง)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.fillText("ไปยัง", 45, 240);
    ctx.fillStyle = "#0f766e";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("บริษัท เพ็ทส์ช็อป จำกัด (PetsShop Co., Ltd.)", 45, 259);
    ctx.fillStyle = "#64748b";
    ctx.font = "11px sans-serif";
    ctx.fillText("พร้อมเพย์: 000-000-0000", 45, 275);

    // เส้นคั่นทึบ
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 295);
    ctx.lineTo(360, 295);
    ctx.stroke();

    // ข้อมูลเลขที่อ้างอิง และ อ้างอิงออร์เดอร์
    const randomRef = "2026" + Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
    setReference(randomRef);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.fillText("เลขที่อ้างอิง:", 45, 325);
    ctx.fillStyle = "#334155";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(randomRef, 150, 325);

    ctx.fillStyle = "#64748b";
    ctx.fillText("อ้างอิงรายการ:", 45, 350);
    ctx.fillStyle = "#334155";
    ctx.fillText(`Order #${orderId.slice(-8).toUpperCase()}`, 150, 350);

    // เส้นคั่นทึบ 2
    ctx.beginPath();
    ctx.moveTo(40, 375);
    ctx.lineTo(360, 375);
    ctx.stroke();

    // 5. ยอดเงินโอนตัวโตๆ
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("จำนวนเงิน:", 45, 410);

    ctx.fillStyle = "#0f766e";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`, 355, 412);

    // 6. ตราสัญลักษณ์ตรวจสอบความปลอดภัยและ QR Code จำลองด้านล่าง
    // วาดไอคอนสีเขียวสำเร็จ
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(60, 475, 16, 0, Math.PI * 2);
    ctx.fill();
    // เครื่องหมายติ๊กถูกในวงกลม
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(53, 475);
    ctx.lineTo(58, 480);
    ctx.lineTo(68, 470);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#0f766e";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("ตรวจสอบสลิปสำเร็จ", 88, 470);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.fillText("ผู้รับเงินได้รับยอดเงินเรียบร้อยแล้ว", 88, 485);

    // วาดบาร์โค้ด / ลายจุด QR Mockup เล็กๆ ด้านข้าง
    ctx.fillStyle = "#334155";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if ((r + c) % 2 === 0 || (r === 0 && c === 0) || (r === 4 && c === 4)) {
          ctx.fillRect(315 + c * 6, 455 + r * 6, 4, 4);
        }
      }
    }
    // ขอบ QR mockup
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(310, 450, 40, 40);

    // 7. หมายเหตุทดสอบระบบด้านล่างสุด
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("จำลองสลิปเพื่อทดสอบการจ่ายเงิน PetsShop Sandbox เท่านั้น", 200, 522);

    // 8. ดึงข้อมูลรูปภาพและเซ็ตลง State
    const dataUrl = canvas.toDataURL("image/png");
    setSlipUrl(dataUrl);
    setFileName("Generated-Mock-Slip.png");
  };

  // ล้างรูปภาพที่เลือก
  const handleClearSlip = () => {
    setSlipUrl("");
    setFileName(null);
    setReference("");
    setMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ส่งข้อมูลสลิปไปยัง API
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slipUrl) {
      setMsg({ type: "error", text: "กรุณาแนบหรือเจนรูปภาพสลิปเงินโอนก่อนครับ" });
      return;
    }

    setLoading(true);
    setMsg(null);
    
    try {
      const res = await fetch(`/api/payments/${orderId}/slip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipUrl, reference })
      });
      setLoading(false);
      
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: "error", text: d.error ?? "บันทึกสลิปไม่สำเร็จ" });
        return;
      }
      
      setMsg({ type: "success", text: "ส่งสลิปชำระเงินเรียบร้อยแล้ว! ระบบกำลังพาไปหน้าอัปเดต" });
      router.refresh();
    } catch (err) {
      setLoading(false);
      setMsg({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 text-sm">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          การดำเนินการชำระเงิน
        </label>
        
        {/* ปุ่มสร้างสลิปจำลองอัตโนมัติ - ไฮไลท์หลักของระบบจ่ายเงิน Sandbox */}
        <button
          type="button"
          onClick={handleGenerateMockSlip}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 font-semibold text-white shadow-md shadow-emerald-100 hover:from-emerald-700 hover:to-teal-700 transition duration-200"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          สร้างสลิปธนาคารจำลองอัตโนมัติ
        </button>
      </div>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-3 text-xs font-semibold text-slate-400">หรือแนบไฟล์รูปภาพ</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* เลือกแนบไฟล์จริงสลิป */}
      {!slipUrl && !showManualUrl ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-6 text-center cursor-pointer transition duration-200"
        >
          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-brand-600 mx-auto mb-2.5 transition duration-200" />
          <span className="block font-semibold text-slate-700 text-xs group-hover:text-brand-700 transition">
            คลิกเลือกภาพถ่ายใบเสร็จ/สลิปโอนเงิน
          </span>
          <span className="block text-[10px] text-slate-400 mt-1">
            รองรับไฟล์ PNG, JPG หรือ JPEG
          </span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : null}

      {/* ลิงก์ URL สลิปแบบเก่า (ซ่อนไว้ให้ดูคลีน แต่เข้าถึงได้ผ่านปุ่มสลับ) */}
      {showManualUrl && !slipUrl && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-semibold text-slate-700 text-xs">ระบุ URL ของรูปสลิป</label>
            <button 
              type="button" 
              onClick={() => setShowManualUrl(false)} 
              className="text-[10px] text-brand-600 font-bold hover:underline"
            >
              กลับไปใช้อัปโหลดไฟล์
            </button>
          </div>
          <input 
            className="input" 
            type="url" 
            placeholder="https://example.com/slip.jpg" 
            value={slipUrl} 
            onChange={(e) => {
              setSlipUrl(e.target.value);
              setFileName("Manual-Image-URL");
            }} 
          />
        </div>
      )}

      {/* เมื่อมี Slip ที่เลือก หรือ เจนเสร็จแล้ว */}
      {slipUrl && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
          <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-slate-100">
            <div className="truncate pr-4">
              <p className="text-xs font-semibold text-slate-800 truncate">{fileName ?? "Slip-Image"}</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> สลิปพร้อมส่งข้อมูล
              </p>
            </div>
            <button 
              type="button" 
              onClick={handleClearSlip}
              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="ล้างข้อมูลสลิป"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* สกรีนพรีวิวสลิปตรงนั้นเลย */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-white flex justify-center items-center shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              alt="Uploaded payment slip preview" 
              src={slipUrl} 
              className="object-contain max-h-52 py-2" 
            />
          </div>
        </div>
      )}

      {/* ฟิลด์เลขอ้างอิงทำรายการธนาคาร */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          หมายเลขการทำรายการ (Transaction Ref.)
        </label>
        <input 
          className="input font-semibold" 
          placeholder="เช่น 012345678901 (ระบบจะใส่ให้อัตโนมัติเมื่อกดจำลองสลิป)" 
          value={reference} 
          onChange={(e) => setReference(e.target.value)} 
        />
      </div>

      {/* ปุ่มกดส่งฟอร์ม */}
      <button 
        type="submit"
        disabled={loading || !slipUrl} 
        className="btn-primary w-full py-2.5 font-bold shadow-md shadow-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition duration-200"
      >
        {loading ? "กำลังบันทึกข้อมูล..." : "ส่งสลิปหลักฐานชำระเงิน"}
      </button>

      {/* สวิตช์สลับ URL แบบเก่า */}
      {!slipUrl && !showManualUrl && (
        <div className="text-center">
          <button 
            type="button" 
            onClick={() => setShowManualUrl(true)} 
            className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline inline-flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" /> หรือกรอก URL ของรูปภาพเองแบบเดิม
          </button>
        </div>
      )}

      {/* แสดงข้อความผลลัพธ์การทำงาน */}
      {msg && (
        <div className={`rounded-xl px-3.5 py-2.5 text-xs flex items-start gap-2 ${
          msg.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
            : "bg-rose-50 text-rose-800 border border-rose-100"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
          <span>{msg.text}</span>
        </div>
      )}
    </form>
  );
}

