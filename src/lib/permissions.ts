// ตัวช่วยตรวจสิทธิ์ตามบทบาทผู้ใช้
export type UserRole = "CUSTOMER" | "SHOP_OWNER" | "SHOP_STAFF" | "ADMIN";

export type SessionUser = {
  id: string;
  role: string;
  status: string;
};

export const isAdmin = (u?: SessionUser | null) => u?.role === "ADMIN";
export const isShopStaff = (u?: SessionUser | null) =>
  u?.role === "SHOP_OWNER" || u?.role === "SHOP_STAFF";
export const isCustomer = (u?: SessionUser | null) => u?.role === "CUSTOMER";

export const canAccessAdmin = (u?: SessionUser | null) => isAdmin(u);
export const canManageShop = (u?: SessionUser | null) => isShopStaff(u) || isAdmin(u);
