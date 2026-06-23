# PetsShop — Marketplace สำหรับร้านสัตว์เลี้ยงและฟาร์ม

Marketplace เต็มรูปแบบสำหรับลูกค้า เจ้าของร้าน และผู้ดูแลระบบ ตามสเปกในเอกสาร
`pet-shop-platform-design.md` และ `user-role-structure-pet-shop.md`

## Stack

- **Next.js 15** App Router + **TypeScript** + **Tailwind CSS**
- **Prisma ORM** + **SQLite** (สำหรับ MVP, สลับเป็น PostgreSQL ได้ง่าย)
- **NextAuth v5** (Credentials provider) + bcryptjs
- **Zod** สำหรับ validation

## วิธีเริ่มใช้งาน

```bash
npm install
npm run db:push     # สร้าง schema ลง SQLite (prisma/dev.db)
npm run db:seed     # ใส่ข้อมูลตัวอย่าง + admin/shop/customer
npm run dev         # เปิด http://localhost:3000
```



## โครงสร้างหน้าหลัก

### ลูกค้า
- `/` หน้าแรก · `/products` สินค้า · `/products/[id]`
- `/animals` สัตว์เลี้ยง · `/animals/[id]`
- `/farms` ฟาร์ม · `/farms/[id]`
- `/shops` ร้านค้า · `/shops/[id]`
- `/cart` ตะกร้า · `/checkout` ชำระเงิน
- `/orders` คำสั่งซื้อของฉัน · `/orders/[id]` (อัปโหลดสลิป)
- `/profile` โปรไฟล์

### Shop Owner / Shop Staff (`/shop/*`)
- Dashboard, จัดการสินค้า (เพิ่ม/แก้/ลบ), ดู order ของร้าน, อัปเดตสถานะจัดส่ง, ตั้งค่าร้าน

### Admin (`/admin/*`)
- Dashboard · จัดการ User · อนุมัติ/ระงับร้านค้า · จัดการสินค้า/สัตว์/ฟาร์ม · คำสั่งซื้อ · **ตรวจสลิป**

## API หลัก
- `POST /api/register` · `POST/PUT/DELETE /api/cart`
- `POST /api/orders` · `POST /api/payments/[orderId]/slip`
- `/api/shop/*` (สำหรับ shop owner) · `/api/admin/*` (สำหรับ admin)

## สลับเป็น PostgreSQL (production)

1. ใน `prisma/schema.prisma` เปลี่ยน `provider = "sqlite"` → `"postgresql"`
2. แปลงฟิลด์ string-enum เป็น Prisma `enum` (เช่น `UserRole`, `OrderStatus` ฯลฯ)
3. เปลี่ยน `farm.animalTypes String` → `String[]`
4. ตั้ง `DATABASE_URL` ใน `.env` ให้ชี้ไป PostgreSQL
5. `npx prisma migrate dev --name init`

## ขั้นตอนต่อยอด (ตามเอกสารเฟส 2-3)
- เชื่อม payment gateway จริง (PromptPay/Omise/2C2P)
- ระบบรีวิว (มี schema แล้ว ต่อ UI เพิ่ม)
- ระบบแชทลูกค้า-ร้าน
- อัปโหลดไฟล์จริง (Supabase Storage / S3)
- แผนที่ Mapbox / Google Maps
- ระบบเอกสารสุขภาพสัตว์ + ใบอนุญาตฟาร์ม
- ค้นหาขั้นสูงด้วย Meilisearch / Elasticsearch
