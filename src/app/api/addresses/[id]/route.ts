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

// PUT: แก้ไขที่อยู่จัดส่ง
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "ไม่พบที่อยู่นี้ในระบบ" }, { status: 404 });
    }

    if (existingAddress.userId !== session.user.id) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขที่อยู่นี้" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, phone, addressLine, province, district, subDistrict, postalCode, isDefault } = parsed.data;

    const updatedAddress = await prisma.$transaction(async (tx) => {
      // หากเปลี่ยนที่อยู่นี้เป็นค่าเริ่มต้น ให้เคลียร์ที่อยู่อื่นทั้งหมด
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false }
        });
      }

      return await tx.address.update({
        where: { id },
        data: {
          name,
          phone,
          addressLine,
          province,
          district,
          subDistrict: subDistrict || "",
          postalCode,
          isDefault
        }
      });
    });

    return NextResponse.json(updatedAddress);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "แก้ไขที่อยู่ไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE: ลบที่อยู่จัดส่ง
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "ไม่พบที่อยู่นี้ในระบบ" }, { status: 404 });
    }

    if (existingAddress.userId !== session.user.id) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ลบที่อยู่นี้" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id }
      });

      // หากที่อยู่ที่ลบไปเคยเป็นที่อยู่เริ่มต้น และยังมีที่อยู่อื่นเหลืออยู่ ให้ตั้งตัวอื่นเป็นค่าเริ่มต้นแทน
      if (existingAddress.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId: session.user.id }
        });
        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true }
          });
        }
      }
    });

    return NextResponse.json({ ok: true, message: "ลบที่อยู่สำเร็จแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ลบที่อยู่ไม่สำเร็จ" }, { status: 500 });
  }
}
