// หน้าผู้ดูแลระบบ: จัดการสไลด์แบนเนอร์ในหน้าแรก
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminBannerListClient from "./AdminBannerListClient";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // โหลดรายการแบนเนอร์ทั้งหมด
  const banners = await prisma.banner.findMany({
    orderBy: { order: "asc" }
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🖼️ จัดการแบนเนอร์หน้าแรก</h1>
          <p className="text-sm text-slate-500">จัดการข้อมูลรูปภาพสไลด์แบนเนอร์ โปรโมชันนัดหมาย ในระบบหน้าแรก</p>
        </div>
      </div>

      <AdminBannerListClient
        initialBanners={banners.map(b => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle ?? "",
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl ?? "",
          order: b.order
        }))}
      />
    </div>
  );
}
