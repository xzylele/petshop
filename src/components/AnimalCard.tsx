// การ์ดแสดงข้อมูลสัตว์แบบย่อ
import Link from "next/link";
import { formatTHB } from "@/lib/utils";

type Props = {
  id: string;
  name?: string | null;
  animalType: string;
  breed?: string | null;
  gender?: string | null;
  price: number;
  imageUrl?: string | null;
  isExotic?: boolean;
  farmName?: string | null;
  status?: string;
};

export default function AnimalCard({ id, name, animalType, breed, gender, price, imageUrl, isExotic, farmName, status }: Props) {
  return (
    <Link href={`/animals/${id}`} className="card group block overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name ?? animalType} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">ไม่มีรูป</div>
        )}
        {isExotic && <span className="badge absolute left-2 top-2 bg-amber-100 text-amber-800">สัตว์แปลก</span>}
        {status === "SOLD" && <span className="badge absolute right-2 top-2 bg-slate-700 text-white">ขายแล้ว</span>}
        {status === "RESERVED" && <span className="badge absolute right-2 top-2 bg-blue-100 text-blue-700">จองแล้ว</span>}
      </div>
      <div className="p-3">
        <div className="mb-1 text-xs text-slate-500">{animalType}{breed ? ` · ${breed}` : ""}{gender ? ` · ${gender}` : ""}</div>
        <div className="line-clamp-1 text-sm font-medium text-slate-800">{name ?? "สัตว์ไม่ระบุชื่อ"}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-700">{formatTHB(price)}</span>
        </div>
        {farmName && <div className="mt-1 truncate text-xs text-slate-500">🏡 {farmName}</div>}
      </div>
    </Link>
  );
}
