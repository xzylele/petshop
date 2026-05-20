// การ์ดแสดงข้อมูลสินค้าแบบย่อ
import Link from "next/link";
import { formatTHB } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  category: string;
  petType?: string | null;
  price: number;
  imageUrl?: string | null;
  shopName?: string;
  stock?: number;
};

export default function ProductCard({ id, name, category, petType, price, imageUrl, shopName, stock }: Props) {
  return (
    <Link href={`/products/${id}`} className="card group block overflow-hidden transition hover:shadow-md">
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">ไม่มีรูป</div>
        )}
      </div>
      <div className="p-3">
        <div className="mb-1 flex items-center gap-1 text-xs text-slate-500">
          <span>{category}</span>
          {petType && <span>· {petType}</span>}
        </div>
        <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-800">{name}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-700">{formatTHB(price)}</span>
          {typeof stock === "number" && stock <= 0 && <span className="badge bg-red-100 text-red-700">หมด</span>}
        </div>
        {shopName && <div className="mt-1 truncate text-xs text-slate-500">{shopName}</div>}
      </div>
    </Link>
  );
}
