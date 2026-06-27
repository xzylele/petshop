"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

interface BannerSliderProps {
  banners: BannerSlide[];
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  // เลื่อนไปสไลด์ถัดไป
  const handleNext = () => {
    setCurrentIdx((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  // ย้อนกลับสไลด์ก่อนหน้า
  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  // ตั้งค่าระบบ Auto-play ให้สไลด์วนอัตโนมัติทุก 5 วินาที
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // หากไม่มีแบนเนอร์ในฐานข้อมูลเลย ให้แสดงแบนเนอร์เริ่มต้น (Fallback Hero)
  if (banners.length === 0) {
    return (
      <section className="relative rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-16 text-white md:px-12 shadow-md overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="grid items-center gap-8 md:grid-cols-2 relative z-10">
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl tracking-tight">
              ทุกอย่างเพื่อสัตว์เลี้ยงของคุณ
            </h1>
            <p className="text-brand-50 text-sm font-medium max-w-md leading-relaxed">
              แหล่งรวมอาหาร ของเล่น อุปกรณ์ดูแลสัตว์เลี้ยง และฟาร์มเพาะพันธุ์ที่ได้มาตรฐานระดับสากล พร้อมรับประกันคุณภาพและความคุ้มค่า
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-750 hover:bg-brand-50 shadow-sm transition"
              >
                ดูสินค้าทั้งหมด
              </Link>
              <Link
                href="/animals"
                className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
              >
                ดูสัตว์เลี้ยงน้องใหม่
              </Link>
            </div>
          </div>
          <div className="hidden text-center md:block">
            <div className="text-[10rem] leading-none drop-shadow-xl animate-bounce duration-[3000ms]">🐶🐱🐰</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative rounded-2xl aspect-[16/7] md:aspect-[16/5.5] w-full overflow-hidden bg-slate-900 shadow-md group">
      {/* Slides Container */}
      <div className="w-full h-full relative">
        {banners.map((slide, idx) => {
          const isActive = idx === currentIdx;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {slide.linkUrl ? (
                <Link href={slide.linkUrl} className="block w-full h-full cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt="Banner Slide"
                    className="w-full h-full object-cover select-none"
                  />
                </Link>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={slide.imageUrl}
                  alt="Banner Slide"
                  className="w-full h-full object-cover select-none"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows (แสดงเฉพาะเมื่อมีแบนเนอร์มากกว่า 1 อัน) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIdx ? "bg-white scale-125 px-2.5" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
