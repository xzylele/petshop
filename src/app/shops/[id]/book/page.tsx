import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingFormClient from "./BookingFormClient";

export const dynamic = "force-dynamic";

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookServicePage({ params }: BookPageProps) {
  const session = await auth();
  if (!session?.user) {
    const { id } = await params;
    redirect(`/login?callbackUrl=/shops/${id}/book`);
  }

  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id }
  });

  if (!shop) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="card p-6 md:p-8">
        <h1 className="text-xl font-bold text-slate-800">📅 จองคิวบริการสัตว์เลี้ยง</h1>
        <p className="mt-1 text-sm text-slate-500">
          ผู้ให้บริการ: <strong>🏪 {shop.name}</strong>
        </p>
        <hr className="my-5 border-slate-100" />
        <BookingFormClient 
          shopId={shop.id} 
          allowsGrooming={shop.allowsGrooming}
          allowsBoarding={shop.allowsBoarding}
          boardingPrice={shop.boardingPrice}
          groomingPriceSmall={shop.groomingPriceSmall}
          groomingPriceMedium={shop.groomingPriceMedium}
          groomingPriceLarge={shop.groomingPriceLarge}
          spaPriceSmall={shop.spaPriceSmall}
          spaPriceMedium={shop.spaPriceMedium}
          spaPriceLarge={shop.spaPriceLarge}
        />
      </div>
    </div>
  );
}
