import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BookingBodySchema = z.object({
  shopId: z.string(),
  petName: z.string().min(1, "กรุณากรอกชื่อสัตว์เลี้ยง"),
  petType: z.string().min(1, "กรุณาเลือกประเภทสัตว์เลี้ยง"),
  serviceType: z.enum(["GROOMING", "PET_HOTEL", "SPA"]),
  dateTime: z.string().transform((val) => new Date(val)),
  notes: z.string().optional(),
  // ฟิลด์ใหม่สำหรับการคิดราคาพิเศษ
  petWeight: z.number().nullable().optional(),
  checkOutDateTime: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
  days: z.number().int().nullable().optional()
});

// GET: ดึงรายการจองคิว (สำหรับลูกค้าของตัวเอง หรือสำหรับผู้ขายดึงตามร้าน)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  try {
    if (shopId) {
      // ตรวจสอบสิทธิ์ว่าเป็นเจ้าของร้านค้าดังกล่าวหรือไม่
      const shop = await prisma.shop.findUnique({
        where: { id: shopId }
      });

      if (!shop || (shop.ownerId !== session.user.id && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      const bookings = await prisma.booking.findMany({
        where: { shopId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { dateTime: "asc" }
      });

      return NextResponse.json({ bookings });
    } else {
      // ดึงรายการจองของลูกค้าคนนั้น ๆ
      const bookings = await prisma.booking.findMany({
        where: { userId: session.user.id },
        include: {
          shop: {
            select: {
              name: true,
              phone: true
            }
          }
        },
        orderBy: { dateTime: "desc" }
      });

      return NextResponse.json({ bookings });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: สร้างรายการจองคิวใหม่
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rawData = await req.json().catch(() => null);
    const parsed = BookingBodySchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { shopId, petName, petType, serviceType, dateTime, notes, petWeight, checkOutDateTime, days } = parsed.data;

    // ตรวจสอบว่าร้านค้ามีอยู่จริง
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ error: "ไม่พบร้านค้านี้" }, { status: 404 });
    }

    // 1. ตรวจสอบสิทธิ์ประเภทบริการที่ร้านค้ายินยอมให้บริการ
    if ((serviceType === "GROOMING" || serviceType === "SPA") && !shop.allowsGrooming) {
      return NextResponse.json({ error: "ร้านค้านี้ไม่เปิดให้บริการอาบน้ำตัดขนหรือสปา" }, { status: 400 });
    }
    if (serviceType === "PET_HOTEL" && !shop.allowsBoarding) {
      return NextResponse.json({ error: "ร้านค้านี้ไม่เปิดให้บริการรับฝากเลี้ยงสัตว์เลี้ยง" }, { status: 400 });
    }

    // 2. คำนวณราคาคิวตามเงื่อนไขที่กำหนดของร้านค้า
    let price = 0;

    if (serviceType === "GROOMING") {
      const weight = petWeight ?? 0;
      if (weight <= 0) {
        return NextResponse.json({ error: "กรุณาระบุน้ำหนักสัตว์เลี้ยงที่ถูกต้องสำหรับบริการอาบน้ำตัดขน" }, { status: 400 });
      }
      if (weight <= 5) price = shop.groomingPriceSmall;
      else if (weight <= 15) price = shop.groomingPriceMedium;
      else price = shop.groomingPriceLarge;
    } 
    else if (serviceType === "SPA") {
      const weight = petWeight ?? 0;
      if (weight <= 0) {
        return NextResponse.json({ error: "กรุณาระบุน้ำหนักสัตว์เลี้ยงที่ถูกต้องสำหรับบริการสปา" }, { status: 400 });
      }
      if (weight <= 5) price = shop.spaPriceSmall;
      else if (weight <= 15) price = shop.spaPriceMedium;
      else price = shop.spaPriceLarge;
    } 
    else if (serviceType === "PET_HOTEL") {
      const boardingDays = days ?? 1;
      if (boardingDays <= 0) {
        return NextResponse.json({ error: "จำนวนวันรับฝากเลี้ยงต้องมีอย่างน้อย 1 วัน" }, { status: 400 });
      }
      price = boardingDays * shop.boardingPrice;
    }

    // 3. ตรวจสอบโควตาความจุ (Capacity Check)
    if (serviceType === "GROOMING" || serviceType === "SPA") {
      const existingCount = await prisma.booking.count({
        where: {
          shopId,
          serviceType,
          status: { in: ["PENDING", "CONFIRMED"] },
          dateTime: dateTime
        }
      });
      if (existingCount >= 3) {
        return NextResponse.json(
          { error: "ขออภัย ช่วงเวลานี้มีผู้จองเต็มแล้ว (จำกัด 3 คิวต่อชั่วโมง)" },
          { status: 400 }
        );
      }
    } else if (serviceType === "PET_HOTEL" && checkOutDateTime) {
      const checkInDate = new Date(dateTime);
      const checkOutDate = new Date(checkOutDateTime);
      let currentDate = new Date(checkInDate);
      currentDate.setHours(0, 0, 0, 0);
      const lastDate = new Date(checkOutDate);
      lastDate.setHours(23, 59, 59, 999);

      while (currentDate <= lastDate) {
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const activeCount = await prisma.booking.count({
          where: {
            shopId,
            serviceType: "PET_HOTEL",
            status: { in: ["PENDING", "CONFIRMED"] },
            dateTime: { lte: dayEnd },
            checkOutDateTime: { gte: dayStart }
          }
        });

        if (activeCount >= shop.boardingCapacity) {
          const dateFormatted = currentDate.toISOString().split("T")[0];
          return NextResponse.json(
            { error: `ขออภัย วันที่ ${dateFormatted} มีสัตว์เลี้ยงฝากเลี้ยงเต็มความจุแล้ว (${activeCount}/${shop.boardingCapacity} ตัว)` },
            { status: 400 }
          );
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        shopId,
        petName,
        petType,
        serviceType,
        dateTime,
        notes,
        price,
        status: "PENDING",
        petWeight: (serviceType === "GROOMING" || serviceType === "SPA") ? petWeight : null,
        checkOutDateTime: serviceType === "PET_HOTEL" ? checkOutDateTime : null,
        days: serviceType === "PET_HOTEL" ? days : null
      }
    });

    return NextResponse.json({ ok: true, booking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
