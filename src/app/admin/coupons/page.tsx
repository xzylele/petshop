// หน้าผู้ดูแลระบบ: จัดการคูปองส่วนลดของแพลตฟอร์ม
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminCouponListClient from "./AdminCouponListClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // โหลดรายการคูปองส่วนลดส่วนกลางทั้งหมด (shopId = null)
  const coupons = await prisma.coupon.findMany({
    where: { shopId: null },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🎟️ จัดการคูปองส่วนลดกลาง</h1>
          <p className="text-sm text-slate-500">สร้างและจัดการโค้ดส่วนลดของระบบเพื่อมอบให้ลูกค้าใช้ซื้อสินค้า/บริการทั่วแพลตฟอร์ม</p>
        </div>
      </div>

      <AdminCouponListClient
        initialCoupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minPurchase: c.minPurchase,
          maxDiscount: c.maxDiscount ?? null,
          endDate: c.endDate.toISOString(),
          isActive: c.isActive
        }))}
      />
    </div>
  );
}
