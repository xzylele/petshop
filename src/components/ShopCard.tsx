// การ์ดแสดงข้อมูลร้านค้าแบบย่อ
import Link from "next/link";

type Props = {
  id: string;
  name: string;
  province?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  status?: string;
  productCount?: number;
};

export default function ShopCard({ id, name, province, description, coverUrl, status, productCount }: Props) {
  return (
    <Link href={`/shops/${id}`} className="card group block overflow-hidden transition hover:shadow-md">
      <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">🏪</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>🏪 ร้านค้า {province ? `· ${province}` : ""}</span>
          {status === "APPROVED" && <span className="badge bg-emerald-100 text-emerald-700">ตรวจสอบแล้ว</span>}
        </div>
        <div className="mt-1 text-base font-semibold text-slate-800">{name}</div>
        {description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{description}</p>}
        {typeof productCount === "number" && <div className="mt-2 text-xs text-slate-500">สินค้า {productCount} รายการ</div>}
      </div>
    </Link>
  );
}
