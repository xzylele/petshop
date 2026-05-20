// การ์ดแสดงข้อมูลฟาร์มแบบย่อ
import Link from "next/link";

type Props = {
  id: string;
  name: string;
  province?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  animalTypes?: string | null;
};

export default function FarmCard({ id, name, province, description, coverImageUrl, animalTypes }: Props) {
  const types = (animalTypes ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <Link href={`/farms/${id}`} className="card group block overflow-hidden transition hover:shadow-md">
      <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt={name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">ไม่มีรูป</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>🏡</span>
          {province && <span>{province}</span>}
        </div>
        <div className="mt-1 line-clamp-1 text-base font-semibold text-slate-800">{name}</div>
        {description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{description}</p>}
        {types.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {types.map((t) => (
              <span key={t} className="badge bg-brand-100 text-brand-700">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
