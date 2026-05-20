// Root layout ครอบทุกหน้า พร้อม Navbar/Footer และ SessionProvider
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "PetsShop — Marketplace สำหรับสัตว์เลี้ยง",
  description: "ตลาดสินค้าและสัตว์เลี้ยงครบวงจร อาหาร ของเล่น อุปกรณ์ และฟาร์มเพาะพันธุ์"
};

// โหลด session ฝั่งเซิร์ฟเวอร์เพื่อส่งให้ client
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <SessionProvider session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
