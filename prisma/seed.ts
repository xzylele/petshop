// Seed ข้อมูลตัวอย่างสำหรับการพัฒนาและทดสอบระบบ
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// สร้างผู้ใช้ตัวอย่าง ร้านค้า ฟาร์ม และสินค้าเริ่มต้น
async function main() {
  console.log("Seeding database...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // เคลียร์ข้อมูลเดิมในตารางที่มีความสัมพันธ์ เพื่อให้ Seed ข้อมูลและรูปภาพใหม่ทำงานได้อย่างถูกต้อง
  console.log("Clearing existing products, animals, farms, and relationships...");
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.animal.deleteMany({});
  await prisma.farmImage.deleteMany({});
  await prisma.farm.deleteMany({});

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

  const owner2 = await prisma.user.upsert({
    where: { email: "catshop@pets.shop" },
    update: {},
    create: {
      name: "เจ้าของร้าน Cat Lover",
      email: "catshop@pets.shop",
      password: hash("shop1234"),
      role: "SHOP_OWNER",
      status: "ACTIVE"
    }
  });

  const owner3 = await prisma.user.upsert({
    where: { email: "dogshop@pets.shop" },
    update: {},
    create: {
      name: "เจ้าของร้าน Dog Paradise",
      email: "dogshop@pets.shop",
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
    update: {
      allowsGrooming: true,
      allowsBoarding: true
    },
    create: {
      ownerId: owner.id,
      name: "Happy Pet Shop",
      description: "ร้านขายอาหาร ของเล่น และอุปกรณ์สัตว์เลี้ยงครบวงจร",
      phone: "081-234-5678",
      address: "123 ถนนพหลโยธิน",
      province: "กรุงเทพมหานคร",
      latitude: 13.7563,
      longitude: 100.5018,
      status: "APPROVED",
      allowsGrooming: true,
      allowsBoarding: true
    }
  });

  const shop2 = await prisma.shop.upsert({
    where: { ownerId: owner2.id },
    update: {
      allowsGrooming: false,
      allowsBoarding: true
    },
    create: {
      ownerId: owner2.id,
      name: "Cat Lover Shop",
      description: "ร้านขายคอนโดแมว อาหารแมว และอุปกรณ์สำหรับน้องแมวโดยเฉพาะ",
      phone: "082-999-8888",
      address: "456 ถนนสุขุมวิท",
      province: "กรุงเทพมหานคร",
      latitude: 13.7367,
      longitude: 100.5604,
      status: "APPROVED",
      allowsGrooming: false,
      allowsBoarding: true
    }
  });

  const shop3 = await prisma.shop.upsert({
    where: { ownerId: owner3.id },
    update: {
      allowsGrooming: true,
      allowsBoarding: false
    },
    create: {
      ownerId: owner3.id,
      name: "Dog Paradise Shop",
      description: "สวรรค์ของคนรักสุนัข ของเล่น สายรัดอก ขนมสุนัขเกรดนำเข้า",
      phone: "083-777-6666",
      address: "789 ถนนลาดพร้าว",
      province: "กรุงเทพมหานคร",
      latitude: 13.7762,
      longitude: 100.6105,
      status: "APPROVED",
      allowsGrooming: true,
      allowsBoarding: false
    }
  });

  // ใส่สินค้าของร้านที่ 1
  await prisma.product.createMany({
    data: [
      { 
        shopId: shop.id, 
        name: "อาหารแมวพรีเมียม 3 กก.", 
        description: "อาหารแมวเกรดพรีเมียม โปรตีนสูง อุดมด้วยสารอาหารครบถ้วนสำหรับแมวทุกวัย", 
        category: "อาหารสัตว์", 
        petType: "แมว", 
        price: 590, 
        stock: 50, 
        imageUrl: "https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop.id, 
        name: "อาหารสุนัขโต 5 กก.", 
        description: "อาหารสุนัขโตสูตรครบถ้วน บำรุงผิวหนังและเส้นขนให้เงางาม สุขภาพแข็งแรง", 
        category: "อาหารสัตว์", 
        petType: "สุนัข", 
        price: 750, 
        stock: 30, 
        imageUrl: "https://images.unsplash.com/photo-1589724132965-7f850b5fbfa8?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop.id, 
        name: "ของเล่นแมวไม้ขนนก", 
        description: "ของเล่นไม้ขนนกล่อแมว ช่วยกระตุ้นการออกกำลังกายและคลายเครียดให้น้องแมว", 
        category: "ของเล่น", 
        petType: "แมว", 
        price: 120, 
        stock: 100, 
        imageUrl: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop.id, 
        name: "กรงกระต่ายขนาดกลาง", 
        description: "กรงกระต่ายโครงเหล็ก แข็งแรง พื้นพลาสติกทำความสะอาดง่าย ปลอดภัยสำหรับกระต่าย", 
        category: "กรงและบ้าน", 
        petType: "กระต่าย", 
        price: 1290, 
        stock: 12, 
        imageUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop.id, 
        name: "ที่นอนสุนัขนุ่มพิเศษ", 
        description: "ที่นอนสุนัขผ้าฝ้ายนุ่ม สบาย ซักทำความสะอาดได้ รองรับสรีระได้ดี", 
        category: "ที่นอน", 
        petType: "สุนัข", 
        price: 450, 
        stock: 25, 
        imageUrl: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop.id, 
        name: "แชมพูอาบน้ำสุนัข", 
        description: "แชมพูสูตรอ่อนโยน ไม่ระคายเคืองตา ช่วยลดกลิ่นสาบและบำรุงขนให้นุ่มสลวย", 
        category: "อุปกรณ์อาบน้ำและดูแลขน", 
        petType: "สุนัข", 
        price: 220, 
        stock: 80, 
        imageUrl: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  });

  // ใส่สินค้าของร้านที่ 2
  await prisma.product.createMany({
    data: [
      { 
        shopId: shop2.id, 
        name: "คอนโดแมวไม้สน 4 ชั้น", 
        description: "คอนโดแมวขนาดใหญ่ ทำจากไม้สนแท้ แข็งแรงทนทาน มีที่ลับเล็บและเปลนอนในตัว", 
        category: "ที่นอนและคอนโด", 
        petType: "แมว", 
        price: 1890, 
        stock: 15, 
        imageUrl: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop2.id, 
        name: "ทรายแมวเต้าหู้กลิ่นชาเขียว 6 ลิตร", 
        description: "ทรายแมวเต้าหู้ธรรมชาติ 100% จับตัวเป็นก้อนเร็ว ควบคุมกลิ่นดีเยี่ยม สามารถทิ้งลงชักโครกได้", 
        category: "ทรายแมว", 
        petType: "แมว", 
        price: 150, 
        stock: 200, 
        imageUrl: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop2.id, 
        name: "น้ำพุแมวอัตโนมัติกรองน้ำ", 
        description: "น้ำพุแมวดีไซน์มินิมอล ระบบกรองน้ำ 3 ชั้น ช่วยกระตุ้นการดื่มน้ำของน้องแมวเพื่อป้องกันโรคไต", 
        category: "อุปกรณ์ดูแลสัตว์เลี้ยง", 
        petType: "แมว", 
        price: 390, 
        stock: 40, 
        imageUrl: "https://images.unsplash.com/photo-1615087240969-eeff2fa558f2?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  });

  // ใส่สินค้าของร้านที่ 3
  await prisma.product.createMany({
    data: [
      { 
        shopId: shop3.id, 
        name: "สายรัดอกสุนัขสะท้อนแสง", 
        description: "สายรัดอกปรับระดับได้ นุ่มสบาย ไม่ดึงรั้งคอสุนัข พร้อมแถบสะท้อนแสงเพื่อความปลอดภัยในเวลากลางคืน", 
        category: "ปลอกคอและสายจูง", 
        petType: "สุนัข", 
        price: 290, 
        stock: 50, 
        imageUrl: "https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop3.id, 
        name: "ขนมสุนัขเนื้อไก่อบแห้ง 200 กรัม", 
        description: "ผลิตจากเนื้ออกไก่แท้ 100% อบแห้ง ปลอดสารเคมีและสารกันเสีย โปรตีนสูง ไขมันต่ำ เหมาะสำหรับเป็นรางวัล", 
        category: "ขนมสัตว์เลี้ยง", 
        petType: "สุนัข", 
        price: 120, 
        stock: 150, 
        imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        shopId: shop3.id, 
        name: "แชมพูกำจัดเห็บหมัดสูตรสมุนไพร", 
        description: "แชมพูกำจัดเห็บหมัดสารสกัดธรรมชาติ ปลอดภัยต่อสุนัขและผู้เลี้ยง บำรุงผิวหนังและเส้นขนไม่ให้แห้งตึง", 
        category: "อุปกรณ์อาบน้ำและดูแลขน", 
        petType: "สุนัข", 
        price: 180, 
        stock: 90, 
        imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  });

  const farmsData = [
    { 
      name: "ฟาร์มสุนัข Golden House", 
      description: "เพาะพันธุ์สุนัขโกลเด้นรีทรีฟเวอร์ สายเลือดแชมป์ มาตรฐานสายพันธุ์สากล สุขภาพแข็งแรง ได้รับการดูแลอย่างใกล้ชิด", 
      address: "99 หมู่ 3 ต.สันทราย", 
      province: "เชียงใหม่", 
      district: "สันทราย", 
      phone: "089-111-2222", 
      animalTypes: "สุนัข", 
      latitude: 18.7883, 
      longitude: 98.9853, 
      coverImageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop" 
    },
    { 
      name: "ฟาร์มแมว Persian Land", 
      description: "ฟาร์มแมวเปอร์เซียเกรดประกวด ขนฟูนุ่ม ตาโตน่ารัก สุขภาพดี ปลอดเชื้อโรค มีใบรับรองสายพันธุ์อย่างเป็นทางการ", 
      address: "55 ถนนนิมมาน", 
      province: "เชียงใหม่", 
      district: "เมือง", 
      phone: "082-333-4444", 
      animalTypes: "แมว", 
      latitude: 18.7967, 
      longitude: 98.9650, 
      coverImageUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&auto=format&fit=crop" 
    },
    { 
      name: "ฟาร์มกระต่าย Bunny Garden", 
      description: "เพาะพันธุ์กระต่ายสายพันธุ์หูตก Holland Lop แท้ และสายพันธุ์อื่น ๆ สภาพแวดล้อมสะอาด ปลอดภัย เป็นมิตรต่อสัตว์เลี้ยง", 
      address: "12 ซ.รามคำแหง 24", 
      province: "กรุงเทพมหานคร", 
      district: "บางกะปิ", 
      phone: "086-555-6666", 
      animalTypes: "กระต่าย", 
      latitude: 13.7650, 
      longitude: 100.6450, 
      coverImageUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=800&auto=format&fit=crop" 
    }
  ];

  for (const f of farmsData) {
    await prisma.farm.create({ data: f });
  }

  const goldenFarm = await prisma.farm.findFirst({ where: { name: "ฟาร์มสุนัข Golden House" } });
  const persianFarm = await prisma.farm.findFirst({ where: { name: "ฟาร์มแมว Persian Land" } });
  const bunnyFarm = await prisma.farm.findFirst({ where: { name: "ฟาร์มกระต่าย Bunny Garden" } });

  await prisma.animal.createMany({
    data: [
      { 
        farmId: goldenFarm?.id, 
        name: "Bobby", 
        animalType: "สุนัข", 
        breed: "Golden Retriever", 
        gender: "ผู้", 
        price: 25000, 
        description: "ลูกสุนัขโกลเด้นรีทรีฟเวอร์ขี้เล่น อายุ 2 เดือน แข็งแรง ฉีดวัคซีนเข็มแรกแล้ว", 
        imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        farmId: goldenFarm?.id, 
        name: "Luna", 
        animalType: "สุนัข", 
        breed: "Golden Retriever", 
        gender: "เมีย", 
        price: 28000, 
        description: "ลูกสุนัขโกลเด้นเพศเมีย หน้าหวาน ขนหนา สดใสร่าเริง", 
        imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        farmId: persianFarm?.id, 
        name: "Snow", 
        animalType: "แมว", 
        breed: "Persian", 
        gender: "เมีย", 
        price: 18000, 
        description: "ลูกแมวเปอร์เซียสีขาวตาฟ้า ขนฟูหนาเป็นแพะ นิสัยอ้อนเก่ง", 
        imageUrl: "https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        farmId: bunnyFarm?.id, 
        name: "Mochi", 
        animalType: "กระต่าย", 
        breed: "Holland Lop", 
        gender: "ผู้", 
        price: 3500, 
        description: "ลูกกระต่ายฮอลแลนด์ลอปหูตก สีบลูทอร์ท อ้วนกลม เชื่องมือ", 
        imageUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        farmId: null, 
        name: "Spike", 
        animalType: "สัตว์เลื้อยคลาน", 
        breed: "Bearded Dragon", 
        gender: "ผู้", 
        price: 4500, 
        description: "Bearded Dragon นำเข้า สีส้มสดใส เชื่อง ไม่ดุร้าย กินเก่ง แข็งแรง", 
        isExotic: true, 
        imageUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  });

  console.log("Seeded:");
  console.log("  admin:       admin@pets.shop / admin1234");
  console.log("  shop 1:      shop@pets.shop / shop1234");
  console.log("  shop 2:      catshop@pets.shop / shop1234");
  console.log("  shop 3:      dogshop@pets.shop / shop1234");
  console.log("  customer:    customer@pets.shop / customer1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
