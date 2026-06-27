import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const addressSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อผู้รับ"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง"),
  addressLine: z.string().min(5, "กรุณากรอกรายละเอียดที่อยู่"),
  province: z.string().min(1, "กรุณาระบุจังหวัด"),
  district: z.string().min(1, "กรุณาระบุอำเภอ/เขต"),
  subDistrict: z.string().optional().nullable(),
  postalCode: z.string().min(5, "กรุณากรอกรหัสไปรษณีย์ 5 หลัก"),
  isDefault: z.boolean().optional().default(false)
});

// GET: ดึงรายการที่อยู่ทั้งหมดของผู้ใช้
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" }
    });
    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลที่อยู่ได้" }, { status: 500 });
  }
}

// POST: เพิ่มที่อยู่ใหม่
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, phone, addressLine, province, district, subDistrict, postalCode, isDefault } = parsed.data;

    const address = await prisma.$transaction(async (tx) => {
      // หากที่อยู่นี้ตั้งเป็นค่าเริ่มต้น ให้เคลียร์ที่อยู่อื่นทั้งหมดไม่ให้เป็นค่าเริ่มต้น
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false }
        });
      }

      // หากนี่เป็นที่อยู่ชิ้นแรกของผู้ใช้ ให้ตั้งเป็นค่าเริ่มต้นอัตโนมัติ
      const addressCount = await tx.address.count({
        where: { userId: session.user.id }
      });
      const finalIsDefault = addressCount === 0 ? true : isDefault;

      return await tx.address.create({
        data: {
          userId: session.user.id,
          name,
          phone,
          addressLine,
          province,
          district,
          subDistrict: subDistrict || "",
          postalCode,
          isDefault: finalIsDefault
        }
      });
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "สร้างที่อยู่ไม่สำเร็จ" }, { status: 500 });
  }
}
