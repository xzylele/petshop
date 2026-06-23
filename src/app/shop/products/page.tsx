// หน้าสินค้าของร้านค้า พร้อมระบบจัดการสต็อกด่วนและวิเคราะห์ยอดขาย
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTHB } from "@/lib/utils";
import QuickStockEditor from "@/components/QuickStockEditor";
import { 
  Package, 
  TrendingUp, 
  Sparkles, 
  Layers, 
  Eye, 
  EyeOff, 
  AlertTriangle 
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShopProductsPage() {
  const session = await auth();
  const shop = await prisma.shop.findUnique({ where: { ownerId: session!.user.id } });

  if (!shop) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-slate-800">ยังไม่มีร้านค้าในระบบ</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">กรุณาลงทะเบียนตั้งค่าโปรไฟล์ร้านค้าเพื่อดูรายการสินค้า</p>
        <Link href="/shop/profile" className="btn-primary">ไปหน้าตั้งค่าร้าน</Link>
      </div>
    );
  }

  // โหลดรายการสินค้าทั้งหมดของร้านนี้
  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" }
  });

  // โหลดประวัติการสั่งซื้อที่มีการชำระเงินสำเร็จ (ไม่ยกเลิก) เพื่อมาคำนวณยอดขายของแต่ละสินค้า
  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId: { in: products.map((p) => p.id) },
      order: { status: { not: "CANCELLED" } }
    },
    select: {
      productId: true,
      quantity: true,
      price: true
    }
  });

  // คำนวณยอดขายและยอดเงินรวมแยกตามรายสินค้า
  const salesMap: Record<string, { quantity: number; revenue: number }> = {};
  let totalSoldUnits = 0;
  let totalProductRevenue = 0;

  orderItems.forEach((item) => {
    if (!item.productId) return;
    
    // อัปเดตยอดรวมร้านค้า
    totalSoldUnits += item.quantity;
    totalProductRevenue += item.price * item.quantity;

    // อัปเดตรายสินค้า
    if (!salesMap[item.productId]) {
      salesMap[item.productId] = { quantity: 0, revenue: 0 };
    }
    salesMap[item.productId].quantity += item.quantity;
    salesMap[item.productId].revenue += item.price * item.quantity;
  });

  // ค้นหาสินค้าขายดีอันดับหนึ่ง (Best Seller)
  let bestSellerName = "ยังไม่มีการขาย";
  let maxSold = 0;
  
  products.forEach((p) => {
    const soldQty = salesMap[p.id]?.quantity || 0;
    if (soldQty > maxSold) {
      maxSold = soldQty;
      bestSellerName = p.name;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            <Eye className="w-3.5 h-3.5" /> แสดงหน้าร้าน
          </span>
        );
      case "HIDDEN":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <EyeOff className="w-3.5 h-3.5" /> ซ่อนไว้
          </span>
        );
      case "OUT_OF_STOCK":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> สินค้าหมด
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* ส่วนหัวเพจ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">จัดการคลังสินค้าของร้าน</h1>
          <p className="text-sm text-slate-500">จัดการจำนวนสต็อกของสินค้า/สัตว์เลี้ยง และดูข้อมูลสรุปผลการขายอย่างละเอียด</p>
        </div>
        <Link href="/shop/products/new" className="btn-primary shadow-md shadow-brand-100 flex items-center gap-2 self-start sm:self-auto">
          <Sparkles className="w-4 h-4" /> ลงสินค้าใหม่
        </Link>
      </div>

      {/* บล็อกสถิติยอดขายรวม (Analytics Widgets) */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* รวมชิ้นที่ขายได้ */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">รวมชิ้นที่ขายได้สำเร็จ</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{totalSoldUnits} ชิ้น</div>
            <div className="text-[10px] text-slate-400 mt-1">ยอดรวมจำนวนชิ้นสินค้าที่ลูกค้าได้รับจริง</div>
          </div>
        </div>

        {/* ยอดขายสินค้าสะสม */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">ยอดขายสินค้าสะสมรวม</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{formatTHB(totalProductRevenue)}</div>
            <div className="text-[10px] text-slate-400 mt-1">รายได้จากการสั่งซื้อสินค้าทั้งหมดในร้าน</div>
          </div>
        </div>

        {/* สินค้าขายดีที่สุด */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500">สินค้าขายดีที่สุด (Best Seller)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-base font-bold text-slate-800 tracking-tight truncate max-w-[190px]" title={bestSellerName}>
              {bestSellerName}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {maxSold > 0 ? `จำนวนออเดอร์สะสม ${maxSold} ชิ้น` : "ยังไม่มีข้อมูลสั่งซื้อ"}
            </div>
          </div>
        </div>
      </div>

      {/* ตารางจัดการสินค้าและยอดขาย */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">ยังไม่มีสินค้าในร้านของคุณ ณ ขณะนี้</p>
            <Link href="/shop/products/new" className="text-xs font-semibold text-brand-700 hover:underline mt-2 inline-block">
              เพิ่มสินค้าชิ้นแรกของคุณ &rarr;
            </Link>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-4">ชื่อสินค้า</th>
                <th className="p-4">หมวดหมู่</th>
                <th className="p-4">ราคาต่อหน่วย</th>
                <th className="p-4 text-center">คลังสินค้า (ปรับสต็อกด่วน)</th>
                <th className="p-4 text-center">ขายแล้ว</th>
                <th className="p-4 text-right">ยอดขายสะสม</th>
                <th className="p-4">สถานะร้านค้า</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {products.map((p) => {
                const soldQty = salesMap[p.id]?.quantity || 0;
                const soldRev = salesMap[p.id]?.revenue || 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="p-4 font-semibold text-slate-800 max-w-[180px] truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="p-4 text-slate-500">{p.category}</td>
                    <td className="p-4 font-medium text-slate-900">{formatTHB(p.price)}</td>
                    <td className="p-4 flex justify-center">
                      <QuickStockEditor productId={p.id} initialStock={p.stock} />
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-600">
                      {soldQty > 0 ? `${soldQty} ชิ้น` : "—"}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-950">
                      {soldRev > 0 ? formatTHB(soldRev) : "—"}
                    </td>
                    <td className="p-4">{getStatusBadge(p.status)}</td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/shop/products/${p.id}/edit`} 
                        className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline"
                      >
                        แก้ไขสินค้า
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
