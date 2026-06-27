import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shopId } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const serviceType = searchParams.get("serviceType"); // GROOMING | SPA | PET_HOTEL

    if (!shopId) {
      return NextResponse.json({ error: "ไม่พบรหัสร้านค้า" }, { status: 400 });
    }
    if (!dateStr) {
      return NextResponse.json({ error: "กรุณาระบุวันที่" }, { status: 400 });
    }
    if (!serviceType) {
      return NextResponse.json({ error: "กรุณาระบุประเภทบริการ" }, { status: 400 });
    }

    // ตรวจสอบว่าร้านค้ามีอยู่จริง
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ error: "ไม่พบร้านค้านี้" }, { status: 404 });
    }

    // จัดการหาช่วงเวลาใน 1 วัน
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    if (serviceType === "GROOMING" || serviceType === "SPA") {
      // ดึงคิวการจองที่ได้รับการอนุมัติหรือรอการอนุมัติ (ไม่รวมที่ยกเลิก) ในวันนั้นๆ
      const bookings = await prisma.booking.findMany({
        where: {
          shopId,
          serviceType,
          status: { in: ["PENDING", "CONFIRMED"] },
          dateTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          dateTime: true,
        },
      });

      // กำหนดรอบเวลาให้บริการ (09:00 - 17:00 น. รวม 9 รอบ)
      const slots = [
        "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
      ];

      const capacityPerSlot = 3;

      const slotStatus = slots.map((timeStr) => {
        // นับจำนวนการจองที่ตรงกับเวลาชั่วโมงนั้น ๆ
        const count = bookings.filter((b) => {
          const hour = String(b.dateTime.getHours()).padStart(2, "0");
          const minute = String(b.dateTime.getMinutes()).padStart(2, "0");
          const formattedTime = `${hour}:${minute}`;
          return formattedTime === timeStr;
        }).length;

        return {
          time: timeStr,
          booked: count,
          capacity: capacityPerSlot,
          available: count < capacityPerSlot,
        };
      });

      return NextResponse.json({ slots: slotStatus });

    } else if (serviceType === "PET_HOTEL") {
      // สำหรับ Pet Hotel: เช็คความจุรายวันเป็นเวลา 30 วันนับจากวันที่ระบุ
      const startDate = new Date(`${dateStr}T00:00:00`);
      const daysCount = 30;
      const hotelCapacity = shop.boardingCapacity; // ความจุห้องฝากเลี้ยงจากประวัติร้านค้าจริง
      const dailyOccupancy = [];

      for (let i = 0; i < daysCount; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const currentStart = new Date(currentDate);
        currentStart.setHours(0, 0, 0, 0);

        const currentEnd = new Date(currentDate);
        currentEnd.setHours(23, 59, 59, 999);

        // ค้นหาการจองโรงแรมที่ทับซ้อนกับวันปัจจุบัน
        // เงื่อนไข: เช็คอิน <= วันปัจจุบันตอนสิ้นสุดวัน และ เช็คเอาต์ >= วันปัจจุบันตอนเริ่มต้นวัน
        const bookings = await prisma.booking.findMany({
          where: {
            shopId,
            serviceType: "PET_HOTEL",
            status: { in: ["PENDING", "CONFIRMED"] },
            dateTime: {
              lte: currentEnd,
            },
            checkOutDateTime: {
              gte: currentStart,
            },
          },
        });

        dailyOccupancy.push({
          date: currentDate.toISOString().split("T")[0],
          booked: bookings.length,
          capacity: hotelCapacity,
          available: bookings.length < hotelCapacity,
        });
      }

      return NextResponse.json({ occupancy: dailyOccupancy });
    }

    return NextResponse.json({ error: "ไม่รองรับประเภทบริการนี้" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
