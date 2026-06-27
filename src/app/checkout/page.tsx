// หน้าชำระเงิน: สรุปรายการและแสดงฟอร์มชำระเงิน
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";
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
  const total = items.reduce((s, it) => s + (it.product?.price ?? it.animal?.price ?? 0) * it.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="mb-4 text-slate-600">ตะกร้าว่าง ไม่สามารถชำระเงินได้</p>
        <Link href="/products" className="btn-primary">ไปเลือกสินค้า</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ชำระเงิน</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <CheckoutForm addresses={user?.addresses ?? []} />
        </div>
        <aside className="card h-fit p-4">
          <h2 className="mb-3 text-lg font-semibold">สรุปคำสั่งซื้อ</h2>
          <ul className="space-y-2 text-sm">
            {items.map((it) => {
              const name = it.product?.name ?? it.animal?.name ?? it.animal?.animalType;
              const price = it.product?.price ?? it.animal?.price ?? 0;
              return (
                <li key={it.id} className="flex justify-between">
                  <span className="truncate pr-2">{name} × {it.quantity}</span>
                  <span>{formatTHB(price * it.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="my-3 border-t border-slate-200"></div>
          <div className="flex justify-between text-base font-semibold">
            <span>รวมทั้งสิ้น</span>
            <span className="text-brand-700">{formatTHB(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
