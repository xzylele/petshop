// แปลงตัวเลขเป็นสกุลเงินบาทแบบไทย
export function formatTHB(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(amount);
}

// แปลงวันที่ให้เป็นรูปแบบอ่านง่าย (ไทย)
export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ป้ายข้อความสถานะคำสั่งซื้อ
export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PREPARING: "กำลังเตรียมสินค้า",
  SHIPPED: "จัดส่งแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก"
};

// ป้ายข้อความสถานะการชำระเงิน
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "รอชำระเงิน",
  SUBMITTED: "ส่งสลิปแล้ว",
  VERIFIED: "ตรวจสอบแล้ว",
  REJECTED: "ปฏิเสธ",
  REFUNDED: "คืนเงินแล้ว"
};

// ป้ายข้อความสถานะร้านค้า
export const SHOP_STATUS_LABEL: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
  SUSPENDED: "ระงับ"
};
