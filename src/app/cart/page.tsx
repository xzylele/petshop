// หน้าตะกร้าสินค้า: แสดงรายการและสรุปราคา
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";
import CartActions from "./CartActions";

export const dynamic = "force-dynamic";

// โหลดตะกร้าของผู้ใช้ แล้วคำนวณยอดรวม
export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/cart");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { include: { shop: { select: { name: true } } } },
          animal: { include: { farm: { select: { name: true } } } }
        }
      }
    }
  });

  const items = cart?.items ?? [];
  const total = items.reduce((sum, it) => {
    const price = it.product?.price ?? it.animal?.price ?? 0;
    return sum + price * it.quantity;
  }, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">🛒 ตะกร้าสินค้า</h1>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="mb-4 text-slate-500">ตะกร้าของคุณยังว่างอยู่</p>
          <Link href="/products" className="btn-primary">ไปเลือกสินค้า</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            {items.map((it) => {
              const isProduct = !!it.product;
              const name = it.product?.name ?? it.animal?.name ?? it.animal?.animalType ?? "—";
              const price = it.product?.price ?? it.animal?.price ?? 0;
              const sellerName = it.product?.shop?.name ?? it.animal?.farm?.name ?? "—";
              const imageUrl = it.product?.imageUrl ?? it.animal?.imageUrl;
              return (
                <div key={it.id} className="card flex gap-3 p-3">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">{isProduct ? "สินค้า" : "สัตว์เลี้ยง"} · {sellerName}</div>
                    <div className="font-medium text-slate-800">{name}</div>
                    <div className="mt-1 text-brand-700 font-semibold">{formatTHB(price)}</div>
                    <CartActions itemId={it.id} quantity={it.quantity} canChangeQty={isProduct} />
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="card h-fit p-4">
            <h2 className="mb-3 text-lg font-semibold">สรุปคำสั่งซื้อ</h2>
            <div className="flex justify-between text-sm">
              <span>รวม {items.length} รายการ</span>
              <span>{formatTHB(total)}</span>
            </div>
            <div className="my-3 border-t border-slate-200"></div>
            <div className="flex justify-between text-base font-semibold">
              <span>ยอดที่ต้องชำระ</span>
              <span className="text-brand-700">{formatTHB(total)}</span>
            </div>
            <Link href="/checkout" className="btn-primary mt-4 w-full">ไปชำระเงิน</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
