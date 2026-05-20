// Seed ข้อมูลตัวอย่างสำหรับการพัฒนาและทดสอบระบบ
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// สร้างผู้ใช้ตัวอย่าง ร้านค้า ฟาร์ม และสินค้าเริ่มต้น
async function main() {
  console.log("Seeding database...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pets.shop" },
    update: {},
    create: {
      name: "ผู้ดูแลระบบ",
      email: "admin@pets.shop",
      password: hash("admin1234"),
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: "shop@pets.shop" },
    update: {},
    create: {
      name: "เจ้าของร้าน Happy Pet",
      email: "shop@pets.shop",
      password: hash("shop1234"),
      role: "SHOP_OWNER",
      status: "ACTIVE"
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@pets.shop" },
    update: {},
    create: {
      name: "ลูกค้าทดสอบ",
      email: "customer@pets.shop",
      password: hash("customer1234"),
      role: "CUSTOMER",
      status: "ACTIVE"
    }
  });

  const shop = await prisma.shop.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Happy Pet Shop",
      description: "ร้านขายอาหาร ของเล่น และอุปกรณ์สัตว์เลี้ยงครบวงจร",
      phone: "081-234-5678",
      address: "123 ถนนพหลโยธิน",
      province: "กรุงเทพมหานคร",
      latitude: 13.7563,
      longitude: 100.5018,
      status: "APPROVED"
    }
  });

  const existingProducts = await prisma.product.count({ where: { shopId: shop.id } });
  if (existingProducts === 0) {
    await prisma.product.createMany({
      data: [
        { shopId: shop.id, name: "อาหารแมวพรีเมียม 3 กก.", description: "อาหารแมวเกรดพรีเมียม โปรตีนสูง", category: "อาหารสัตว์", petType: "แมว", price: 590, stock: 50, imageUrl: "https://placehold.co/600x400?text=Cat+Food" },
        { shopId: shop.id, name: "อาหารสุนัขโต 5 กก.", description: "อาหารสุนัขโตสูตรครบถ้วน", category: "อาหารสัตว์", petType: "สุนัข", price: 750, stock: 30, imageUrl: "https://placehold.co/600x400?text=Dog+Food" },
        { shopId: shop.id, name: "ของเล่นแมวขนนก", description: "ของเล่นไม้ขนนกล่อแมว", category: "ของเล่น", petType: "แมว", price: 120, stock: 100, imageUrl: "https://placehold.co/600x400?text=Cat+Toy" },
        { shopId: shop.id, name: "กรงกระต่ายขนาดกลาง", description: "กรงกระต่ายโครงเหล็กพื้นพลาสติก", category: "กรงและบ้าน", petType: "กระต่าย", price: 1290, stock: 12, imageUrl: "https://placehold.co/600x400?text=Rabbit+Cage" },
        { shopId: shop.id, name: "ที่นอนสุนัขนุ่ม", description: "ที่นอนสุนัขผ้าฝ้ายซักได้", category: "ที่นอน", petType: "สุนัข", price: 450, stock: 25, imageUrl: "https://placehold.co/600x400?text=Dog+Bed" },
        { shopId: shop.id, name: "แชมพูอาบน้ำสุนัข", description: "แชมพูสูตรอ่อนโยน", category: "อุปกรณ์อาบน้ำและดูแลขน", petType: "สุนัข", price: 220, stock: 80, imageUrl: "https://placehold.co/600x400?text=Dog+Shampoo" }
      ]
    });
  }

  const farms = [
    { name: "ฟาร์มสุนัข Golden House", description: "เพาะพันธุ์สุนัขโกลเด้นรีทรีฟเวอร์ มาตรฐานสายพันธุ์", address: "99 หมู่ 3 ต.สันทราย", province: "เชียงใหม่", district: "สันทราย", phone: "089-111-2222", animalTypes: "สุนัข", latitude: 18.7883, longitude: 98.9853, coverImageUrl: "https://placehold.co/800x500?text=Golden+House+Farm" },
    { name: "ฟาร์มแมว Persian Land", description: "ฟาร์มแมวเปอร์เซีย ขนยาว สุขภาพดี มีใบรับรอง", address: "55 ถนนนิมมาน", province: "เชียงใหม่", district: "เมือง", phone: "082-333-4444", animalTypes: "แมว", latitude: 18.7967, longitude: 98.9650, coverImageUrl: "https://placehold.co/800x500?text=Persian+Land" },
    { name: "ฟาร์มกระต่าย Bunny Garden", description: "เพาะพันธุ์กระต่ายหลากหลายสายพันธุ์", address: "12 ซ.รามคำแหง 24", province: "กรุงเทพมหานคร", district: "บางกะปิ", phone: "086-555-6666", animalTypes: "กระต่าย", latitude: 13.7650, longitude: 100.6450, coverImageUrl: "https://placehold.co/800x500?text=Bunny+Garden" }
  ];

  for (const f of farms) {
    const existing = await prisma.farm.findFirst({ where: { name: f.name } });
    if (!existing) {
      await prisma.farm.create({ data: f });
    }
  }

  const goldenFarm = await prisma.farm.findFirst({ where: { name: "ฟาร์มสุนัข Golden House" } });
  const persianFarm = await prisma.farm.findFirst({ where: { name: "ฟาร์มแมว Persian Land" } });
  const bunnyFarm = await prisma.farm.findFirst({ where: { name: "ฟาร์มกระต่าย Bunny Garden" } });

  const existingAnimals = await prisma.animal.count();
  if (existingAnimals === 0) {
    await prisma.animal.createMany({
      data: [
        { farmId: goldenFarm?.id, name: "Bobby", animalType: "สุนัข", breed: "Golden Retriever", gender: "ผู้", price: 25000, description: "ลูกสุนัขโกลเด้นรีทรีฟเวอร์ อายุ 2 เดือน", imageUrl: "https://placehold.co/600x400?text=Golden+Puppy" },
        { farmId: goldenFarm?.id, name: "Luna", animalType: "สุนัข", breed: "Golden Retriever", gender: "เมีย", price: 28000, description: "ลูกสุนัขโกลเด้นเพศเมีย", imageUrl: "https://placehold.co/600x400?text=Golden+Female" },
        { farmId: persianFarm?.id, name: "Snow", animalType: "แมว", breed: "Persian", gender: "เมีย", price: 18000, description: "ลูกแมวเปอร์เซียขาว", imageUrl: "https://placehold.co/600x400?text=Persian+White" },
        { farmId: bunnyFarm?.id, name: "Mochi", animalType: "กระต่าย", breed: "Holland Lop", gender: "ผู้", price: 3500, description: "ลูกกระต่ายฮอลแลนด์ลอป", imageUrl: "https://placehold.co/600x400?text=Holland+Lop" },
        { farmId: null, name: "Spike", animalType: "สัตว์เลื้อยคลาน", breed: "Bearded Dragon", gender: "ผู้", price: 4500, description: "Bearded Dragon นำเข้า", isExotic: true, imageUrl: "https://placehold.co/600x400?text=Bearded+Dragon" }
      ]
    });
  }

  console.log("Seeded:");
  console.log("  admin:    admin@pets.shop / admin1234");
  console.log("  shop:     shop@pets.shop / shop1234");
  console.log("  customer: customer@pets.shop / customer1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
