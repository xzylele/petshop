// Middleware: บังคับล็อกอิน/เช็ก role สำหรับเส้นทางที่ต้องป้องกัน
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ใช้ NextAuth ตรวจ session แล้ว redirect ตามสิทธิ์
export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const user = req.auth?.user;

  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
  const isShopRoute = path === "/shop" || path.startsWith("/shop/");
  const isProtected =
    path.startsWith("/cart") ||
    path.startsWith("/checkout") ||
    path.startsWith("/orders") ||
    path.startsWith("/profile") ||
    isShopRoute ||
    isAdminRoute;

  if (!isProtected) return NextResponse.next();

  if (!user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isShopRoute && user.role !== "SHOP_OWNER" && user.role !== "SHOP_STAFF" && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"]
};
