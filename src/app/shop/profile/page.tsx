// หน้าตั้งค่าร้านค้า (โปรไฟล์ร้าน)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShopProfileForm from "./ShopProfileForm";

export const dynamic = "force-dynamic";

// โหลดข้อมูลร้านเพื่อเติมค่าเริ่มต้นในฟอร์ม
export default async function ShopProfilePage() {
  const session = await auth();
  const shop = await prisma.shop.findUnique({ where: { ownerId: session!.user.id } });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">ตั้งค่าร้านค้า</h1>
      <ShopProfileForm initial={shop ? {
        name: shop.name,
        description: shop.description ?? "",
        phone: shop.phone ?? "",
        address: shop.address ?? "",
        province: shop.province ?? "",
        coverUrl: shop.coverUrl ?? "",
        logoUrl: shop.logoUrl ?? "",
        allowsGrooming: shop.allowsGrooming,
        allowsBoarding: shop.allowsBoarding
      } : null} />
    </div>
  );
}
