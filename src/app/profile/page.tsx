import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

import AddressManager from "./AddressManager";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "ลูกค้า",
  SHOP_OWNER: "เจ้าของร้านค้า",
  SHOP_STAFF: "พนักงานร้าน",
  ADMIN: "ผู้ดูแลระบบ"
};

// โหลดข้อมูลผู้ใช้ พร้อมข้อมูลที่อยู่และร้าน (ถ้ามี)
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: true,
      shop: true
    }
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">โปรไฟล์ของฉัน</h1>

      <div className="card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ชื่อ" value={user.name} />
          <Field label="อีเมล" value={user.email} />
          <Field label="เบอร์โทร" value={user.phone ?? "—"} />
          <Field label="บทบาท" value={ROLE_LABEL[user.role] ?? user.role} />
          <Field label="สถานะบัญชี" value={user.status} />
          <Field label="สมัครเมื่อ" value={formatDate(user.createdAt)} />
        </div>
      </div>

      {user.shop && (
        <div className="card mt-6 p-6">
          <h2 className="mb-2 text-lg font-semibold">ร้านของคุณ</h2>
          <Field label="ชื่อร้าน" value={user.shop.name} />
          <Field label="สถานะร้าน" value={user.shop.status} />
        </div>
      )}

      <div className="card mt-6 p-6">
        <AddressManager />
      </div>


    </div>
  );
}

// แถวแสดงข้อมูลแบบ label/value
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}
