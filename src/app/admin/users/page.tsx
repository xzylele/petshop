// หน้าแอดมินจัดการผู้ใช้
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import UserActions from "./UserActions";

export const dynamic = "force-dynamic";

// โหลดผู้ใช้ทั้งหมดเรียงตามวันที่สมัคร
export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">จัดการผู้ใช้</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">ชื่อ</th><th className="p-3">อีเมล</th><th className="p-3">บทบาท</th><th className="p-3">สถานะ</th><th className="p-3">สมัครเมื่อ</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">{formatDate(u.createdAt)}</td>
                <td className="p-3 text-right"><UserActions id={u.id} role={u.role} status={u.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
