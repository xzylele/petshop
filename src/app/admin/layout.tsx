// เลย์เอาต์หลังบ้านแอดมิน พร้อมเมนูด้านข้าง
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";
import { ShieldCheck, LogOut, ArrowLeft, User as UserIcon } from "lucide-react";

export const dynamic = "force-dynamic";

// บังคับเฉพาะผู้ใช้ role ADMIN
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const userInitial = session.user.name ? session.user.name.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-200/50">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">Petkub Portal</span>
              <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 uppercase border border-rose-100">Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าหลักร้านค้า
            </Link>
            
            <div className="h-6 w-[1px] bg-slate-200" />
            
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-sm shadow-sm ring-2 ring-white">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{session.user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{session.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-24 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <AdminSidebar />
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 md:p-8 shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

