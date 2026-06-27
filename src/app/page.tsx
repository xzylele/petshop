// หน้าแรก: แสดงสินค้า/สัตว์/ฟาร์มแนะนำ
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import AnimalCard from "@/components/AnimalCard";
import FarmCard from "@/components/FarmCard";
import BannerSlider from "@/components/BannerSlider";

export const dynamic = "force-dynamic";

// โหลดข้อมูลแนะนำจากฐานข้อมูลแล้วเรนเดอร์การ์ด
export default async function HomePage() {
  const [featuredProducts, featuredAnimals, featuredFarms, banners] = await Promise.all([
    prisma.product.findMany({
      where: { 
        status: "ACTIVE",
        shop: { status: "APPROVED" }
      },
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.animal.findMany({
      where: { 
        status: "ACTIVE",
        OR: [
          { farmId: null },
          { farm: { status: "ACTIVE" } }
        ]
      },
      include: { farm: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.farm.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.banner.findMany({
      orderBy: { order: "asc" }
    })
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Hero Banner Slider */}
      <BannerSlider banners={banners} />

      {/* Categories quick access */}
      <section className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <CategoryTile href="/products?category=อาหารสัตว์" emoji="🥣" label="อาหารสัตว์" />
        <CategoryTile href="/products?category=ของเล่น" emoji="🧸" label="ของเล่น" />
        <CategoryTile href="/products?category=กรงและบ้าน" emoji="🏠" label="กรงและบ้าน" />
        <CategoryTile href="/products?category=ที่นอน" emoji="🛏️" label="ที่นอน" />
      </section>

      {/* Featured products */}
      <SectionTitle title="สินค้าแนะนำ" link="/products" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {featuredProducts.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            category={p.category}
            petType={p.petType}
            price={p.price}
            imageUrl={p.imageUrl}
            shopName={p.shop?.name}
            stock={p.stock}
          />
        ))}
      </div>

      {/* Featured animals */}
      <SectionTitle title="สัตว์เลี้ยงน้องใหม่" link="/animals" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {featuredAnimals.map((a) => (
          <AnimalCard
            key={a.id}
            id={a.id}
            name={a.name}
            animalType={a.animalType}
            breed={a.breed}
            gender={a.gender}
            price={a.price}
            imageUrl={a.imageUrl}
            isExotic={a.isExotic}
            farmName={a.farm?.name ?? null}
            status={a.status}
          />
        ))}
      </div>

      {/* Featured farms */}
      <SectionTitle title="ฟาร์มเพาะพันธุ์มาตรฐาน" link="/farms" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {featuredFarms.map((f) => (
          <FarmCard
            key={f.id}
            id={f.id}
            name={f.name}
            province={f.province}
            description={f.description}
            coverImageUrl={f.coverImageUrl}
            animalTypes={f.animalTypes}
          />
        ))}
      </div>
    </div>
  );
}

// ปุ่มลัดหมวดหมู่บนหน้าแรก
function CategoryTile({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link href={href} className="card flex flex-col items-center gap-2 p-4 transition hover:shadow-md">
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </Link>
  );
}

// หัวข้อย่อยพร้อมลิงก์ดูทั้งหมด
function SectionTitle({ title, link }: { title: string; link: string }) {
  return (
    <div className="mb-4 mt-10 flex items-end justify-between">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <Link href={link} className="text-sm text-brand-700 hover:underline">ดูทั้งหมด →</Link>
    </div>
  );
}
