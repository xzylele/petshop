// หน้าชำระเงิน: สรุปรายการและแสดงฟอร์มชำระเงิน
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

// โหลดตะกร้าผู้ใช้ แล้วส่งให้ฟอร์มชำระเงิน
export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/checkout");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { addresses: { orderBy: { isDefault: "desc" } } }
  });

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
          animal: true
        }
      }
    }
  });

  const items = cart?.items ?? [];
  const initialTotal = items.reduce(
    (s, it) => s + (it.product?.price ?? it.animal?.price ?? 0) * it.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="mb-4 text-slate-600">ตะกร้าว่าง ไม่สามารถชำระเงินได้</p>
        <Link href="/products" className="btn-primary">ไปเลือกสินค้า</Link>
      </div>
    );
  }

  // ดึงคูปองส่วนลดที่ผู้ใช้อาจใช้งานได้
  const shopIds = items.map((it) => it.product?.shopId).filter(Boolean) as string[];
  const availableCoupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      endDate: { gte: new Date() },
      OR: [
        { shopId: { in: shopIds } },
        { shopId: null }
      ]
    },
    include: {
      shop: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 tracking-tight">ชำระเงิน</h1>
      <CheckoutForm
        addresses={user?.addresses ?? []}
        items={items.map(it => ({
          id: it.id,
          name: it.product?.name ?? it.animal?.name ?? it.animal?.animalType ?? "สินค้า",
          price: it.product?.price ?? it.animal?.price ?? 0,
          quantity: it.quantity,
          shopId: it.product?.shopId ?? null,
          imageUrl: it.product?.imageUrl ?? it.animal?.imageUrl ?? null
        }))}
        initialTotal={initialTotal}
        userPoints={user?.points ?? 0}
        availableCoupons={availableCoupons.map(c => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType as "PERCENTAGE" | "FIXED",
          discountValue: c.discountValue,
          minPurchase: c.minPurchase,
          maxDiscount: c.maxDiscount,
          shopName: c.shop?.name ?? "ส่วนลดส่วนกลาง"
        }))}
      />
    </div>
  );
}
