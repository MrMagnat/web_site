import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Unsplash фото по темам (стабильные ID)
const PHOTOS = {
  rugs: [
    "https://images.unsplash.com/photo-1567538096630-e531b6a75c35?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555041469-9816c96b1716?auto=format&fit=crop&w=800&q=80",
  ],
  bedding: [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
  ],
  towels: [
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559181567-c3190b9c5f2a?auto=format&fit=crop&w=800&q=80",
  ],
  decor: [
    "https://images.unsplash.com/photo-1618220048045-10a6dbdf53e0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1616046229478-9328cf7a7e98?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
  ],
};

async function main() {
  console.log("🌱 Начинаем сидирование...");

  // ── Категории ──────────────────────────────────────────
  const catRugs = await prisma.category.upsert({
    where: { slug: "kovrik-dlya-vannoy" },
    update: {},
    create: {
      slug:      "kovrik-dlya-vannoy",
      nameRu:    "Коврики для ванной",
      nameEn:    "Bathroom Rugs",
      image:     PHOTOS.rugs[0],
      sortOrder: 1,
    },
  });

  const catBedding = await prisma.category.upsert({
    where: { slug: "postelnoe-belyo" },
    update: {},
    create: {
      slug:      "postelnoe-belyo",
      nameRu:    "Постельное бельё",
      nameEn:    "Bedding",
      image:     PHOTOS.bedding[0],
      sortOrder: 2,
    },
  });

  const catTowels = await prisma.category.upsert({
    where: { slug: "poletenца" },
    update: {},
    create: {
      slug:      "polotenca",
      nameRu:    "Полотенца",
      nameEn:    "Towels",
      image:     PHOTOS.towels[0],
      sortOrder: 3,
    },
  });

  const catDecor = await prisma.category.upsert({
    where: { slug: "dekor" },
    update: {},
    create: {
      slug:      "dekor",
      nameRu:    "Домашний декор",
      nameEn:    "Home Decor",
      image:     PHOTOS.decor[0],
      sortOrder: 4,
    },
  });

  console.log("✅ Категории созданы");

  // ── 10 Товаров ─────────────────────────────────────────
  const products = [
    // — КОВРИКИ (4 шт) —
    {
      sku:          "AF-RUG-001",
      nameRu:       "Коврик для ванной «Лён»",
      nameEn:       "Linen Bathroom Rug",
      descriptionRu: "Мягкий коврик из натурального льна с антискользящим основанием. Идеально сочетается с любым интерьером ванной комнаты. Приятный на ощупь, быстро сохнет.",
      descriptionEn: "Soft natural linen rug with non-slip backing. Pairs beautifully with any bathroom interior. Comfortable and quick-drying.",
      price:         1290,
      discountPrice: 990,
      images:        [PHOTOS.rugs[0], PHOTOS.rugs[1]],
      sizes:         ["50×80", "40×60", "60×90"],
      colors:        [{ name: "Бежевый", nameEn: "Beige", hex: "#f5e6d3" }, { name: "Серый", nameEn: "Gray", hex: "#c8c4bf" }],
      specsRu:       { "Состав": "100% лён", "Основание": "Антискользящая резина", "Уход": "Стирка 40°, не отбеливать", "Страна": "Россия" },
      specsEn:       { "Material": "100% linen", "Backing": "Non-slip rubber", "Care": "Machine wash 40°, no bleach", "Origin": "Russia" },
      categoryId:    catRugs.id,
      isNew:         false,
      isFeatured:    true,
    },
    {
      sku:          "AF-RUG-002",
      nameRu:       "Коврик «Уют» с бортиком",
      nameEn:       "Cozy Rug with Border",
      descriptionRu: "Пушистый коврик с мягким ворсом и декоративным бортиком. Создаёт атмосферу уюта в любой ванной комнате.",
      descriptionEn: "Plush rug with soft pile and decorative border. Creates a cozy atmosphere in any bathroom.",
      price:         1190,
      discountPrice: null,
      images:        [PHOTOS.rugs[1], PHOTOS.rugs[2]],
      sizes:         ["40×60", "50×80"],
      colors:        [{ name: "Молочный", nameEn: "Milk", hex: "#f7f0ec" }, { name: "Тёмно-серый", nameEn: "Dark Gray", hex: "#4a4a4a" }],
      specsRu:       { "Состав": "100% хлопок", "Высота ворса": "15 мм", "Уход": "Стирка 30°, деликатный режим" },
      specsEn:       { "Material": "100% cotton", "Pile height": "15 mm", "Care": "Machine wash 30°, delicate" },
      categoryId:    catRugs.id,
      isNew:         false,
      isFeatured:    true,
    },
    {
      sku:          "AF-RUG-003",
      nameRu:       "Набор ковриков 2 шт.",
      nameEn:       "2-Piece Rug Set",
      descriptionRu: "Комплект из двух ковриков для ванной и туалета. Единый дизайн создаёт гармоничное пространство.",
      descriptionEn: "Set of two matching rugs for bathroom and toilet. Unified design creates a harmonious space.",
      price:         2390,
      discountPrice: 1890,
      images:        [PHOTOS.rugs[2], PHOTOS.rugs[0]],
      sizes:         ["50×80 + 40×50"],
      colors:        [{ name: "Молочный", nameEn: "Milk", hex: "#f7f0ec" }, { name: "Бежевый", nameEn: "Beige", hex: "#f5e6d3" }],
      specsRu:       { "Состав": "100% хлопок", "В наборе": "2 коврика", "Уход": "Стирка 40°" },
      specsEn:       { "Material": "100% cotton", "Set includes": "2 rugs", "Care": "Machine wash 40°" },
      categoryId:    catRugs.id,
      isNew:         true,
      isFeatured:    true,
    },
    {
      sku:          "AF-RUG-004",
      nameRu:       "Коврик «Классик»",
      nameEn:       "Classic Rug",
      descriptionRu: "Лаконичный коврик в классическом стиле. Плотный ворс, износостойкое основание.",
      descriptionEn: "Minimalist rug in classic style. Dense pile, durable backing.",
      price:         1390,
      discountPrice: null,
      images:        [PHOTOS.rugs[0], PHOTOS.rugs[2]],
      sizes:         ["60×90", "50×80", "40×60"],
      colors:        [{ name: "Тёмно-серый", nameEn: "Dark Gray", hex: "#4a4a4a" }, { name: "Белый", nameEn: "White", hex: "#ffffff" }],
      specsRu:       { "Состав": "80% хлопок, 20% полиэстер", "Уход": "Стирка 40°" },
      specsEn:       { "Material": "80% cotton, 20% polyester", "Care": "Machine wash 40°" },
      categoryId:    catRugs.id,
      isNew:         false,
      isFeatured:    false,
    },
    // — ПОСТЕЛЬНОЕ БЕЛЬЁ (2 шт) —
    {
      sku:          "AF-BED-001",
      nameRu:       "Комплект постельного белья «Нежность»",
      nameEn:       "Tenderness Bedding Set",
      descriptionRu: "Постельное бельё из сатина с мягким блеском. Гипоаллергенное, не линяет после стирки.",
      descriptionEn: "Satin bedding with a soft sheen. Hypoallergenic, colorfast after washing.",
      price:         4990,
      discountPrice: 3990,
      images:        [PHOTOS.bedding[0], PHOTOS.bedding[1]],
      sizes:         ["1.5 спальный", "2 спальный", "Евро"],
      colors:        [{ name: "Белый", nameEn: "White", hex: "#ffffff" }, { name: "Пудровый", nameEn: "Powder", hex: "#f0d9d0" }],
      specsRu:       { "Состав": "100% сатин", "Плотность": "120 г/м²", "В комплекте": "Пододеяльник, 2 наволочки, простынь", "Уход": "Стирка 40°" },
      specsEn:       { "Material": "100% satin", "Density": "120 g/m²", "Includes": "Duvet cover, 2 pillowcases, sheet", "Care": "Machine wash 40°" },
      categoryId:    catBedding.id,
      isNew:         true,
      isFeatured:    true,
    },
    {
      sku:          "AF-BED-002",
      nameRu:       "Наволочки «Классик» 2 шт.",
      nameEn:       "Classic Pillowcases Set of 2",
      descriptionRu: "Пара наволочек из натурального хлопка. Мягкие, дышащие, с клапаном.",
      descriptionEn: "Pair of natural cotton pillowcases. Soft, breathable, with envelope closure.",
      price:         890,
      discountPrice: null,
      images:        [PHOTOS.bedding[2], PHOTOS.bedding[0]],
      sizes:         ["50×70", "70×70"],
      colors:        [{ name: "Белый", nameEn: "White", hex: "#ffffff" }, { name: "Бежевый", nameEn: "Beige", hex: "#f5e6d3" }],
      specsRu:       { "Состав": "100% хлопок", "Застёжка": "Клапан", "В комплекте": "2 наволочки" },
      specsEn:       { "Material": "100% cotton", "Closure": "Envelope flap", "Includes": "2 pillowcases" },
      categoryId:    catBedding.id,
      isNew:         false,
      isFeatured:    false,
    },
    // — ПОЛОТЕНЦА (2 шт) —
    {
      sku:          "AF-TWL-001",
      nameRu:       "Полотенце банное «Велюр»",
      nameEn:       "Velour Bath Towel",
      descriptionRu: "Банное полотенце из велюра. Очень мягкое, хорошо впитывает влагу, быстро сохнет.",
      descriptionEn: "Velour bath towel. Extremely soft, highly absorbent, quick-drying.",
      price:         1590,
      discountPrice: null,
      images:        [PHOTOS.towels[0], PHOTOS.towels[1]],
      sizes:         ["50×90", "70×140"],
      colors:        [{ name: "Белый", nameEn: "White", hex: "#ffffff" }, { name: "Серый", nameEn: "Gray", hex: "#c8c4bf" }, { name: "Бежевый", nameEn: "Beige", hex: "#f5e6d3" }],
      specsRu:       { "Состав": "100% хлопок (велюр)", "Плотность": "500 г/м²", "Уход": "Стирка 60°" },
      specsEn:       { "Material": "100% cotton velour", "Density": "500 g/m²", "Care": "Machine wash 60°" },
      categoryId:    catTowels.id,
      isNew:         true,
      isFeatured:    false,
    },
    {
      sku:          "AF-TWL-002",
      nameRu:       "Набор полотенец 3 шт.",
      nameEn:       "Towel Set of 3",
      descriptionRu: "Набор из трёх полотенец разных размеров. Для лица, рук и тела. Единый дизайн.",
      descriptionEn: "Set of three towels in different sizes. For face, hands and body. Matching design.",
      price:         2990,
      discountPrice: 2490,
      images:        [PHOTOS.towels[1], PHOTOS.towels[2]],
      sizes:         ["Набор: 30×50 + 50×90 + 70×140"],
      colors:        [{ name: "Белый", nameEn: "White", hex: "#ffffff" }, { name: "Молочный", nameEn: "Milk", hex: "#f7f0ec" }],
      specsRu:       { "Состав": "100% хлопок", "В наборе": "3 полотенца", "Плотность": "450 г/м²" },
      specsEn:       { "Material": "100% cotton", "Set includes": "3 towels", "Density": "450 g/m²" },
      categoryId:    catTowels.id,
      isNew:         false,
      isFeatured:    true,
    },
    // — ДЕКОР (2 шт) —
    {
      sku:          "AF-DCR-001",
      nameRu:       "Органайзер для ванной «Уют»",
      nameEn:       "Cozy Bathroom Organizer",
      descriptionRu: "Тканевый органайзер для хранения полотенец и аксессуаров. Элегантный дизайн.",
      descriptionEn: "Fabric organizer for storing towels and accessories. Elegant design.",
      price:         1890,
      discountPrice: null,
      images:        [PHOTOS.decor[0], PHOTOS.decor[1]],
      sizes:         ["Один размер"],
      colors:        [{ name: "Бежевый", nameEn: "Beige", hex: "#f5e6d3" }, { name: "Белый", nameEn: "White", hex: "#ffffff" }],
      specsRu:       { "Материал": "Хлопок, металл", "Размер": "30×15×40 см", "Вместимость": "4-6 полотенец" },
      specsEn:       { "Material": "Cotton, metal", "Size": "30×15×40 cm", "Capacity": "4-6 towels" },
      categoryId:    catDecor.id,
      isNew:         true,
      isFeatured:    false,
    },
    {
      sku:          "AF-DCR-002",
      nameRu:       "Корзина для белья «Скандинавия»",
      nameEn:       "Scandinavian Laundry Basket",
      descriptionRu: "Плетёная корзина для белья в скандинавском стиле. Практичная и стильная.",
      descriptionEn: "Woven laundry basket in Scandinavian style. Practical and stylish.",
      price:         2490,
      discountPrice: 1990,
      images:        [PHOTOS.decor[2], PHOTOS.decor[0]],
      sizes:         ["35 л", "55 л"],
      colors:        [{ name: "Натуральный", nameEn: "Natural", hex: "#d4bc9a" }, { name: "Белый", nameEn: "White", hex: "#ffffff" }],
      specsRu:       { "Материал": "Морская трава", "Объём": "35 или 55 л", "Крышка": "Есть" },
      specsEn:       { "Material": "Seagrass", "Volume": "35 or 55 L", "Lid": "Included" },
      categoryId:    catDecor.id,
      isNew:         false,
      isFeatured:    true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    console.log(`  ✅ ${p.nameRu}`);
  }

  // ── Промокоды ──────────────────────────────────────────
  await prisma.promoCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code:            "WELCOME10",
      discountPercent: 10,
      maxUses:         null,
      isActive:        true,
    },
  });
  await prisma.promoCode.upsert({
    where: { code: "SALE20" },
    update: {},
    create: {
      code:            "SALE20",
      discountPercent: 20,
      maxUses:         100,
      isActive:        true,
      expiresAt:       new Date("2026-12-31"),
    },
  });

  console.log("✅ Промокоды созданы: WELCOME10, SALE20");

  // ── UTM-пример ─────────────────────────────────────────
  await prisma.uTMTag.upsert({
    where: { id: "seed-utm-1" },
    update: {},
    create: {
      id:           "seed-utm-1",
      name:         "Instagram Stories — Апрель 2026",
      source:       "instagram",
      medium:       "story",
      campaign:     "spring2026",
      baseUrl:      "/",
      generatedUrl: "/?utm_source=instagram&utm_medium=story&utm_campaign=spring2026",
    },
  });

  console.log("✅ UTM-метка создана");
  console.log("\n🎉 Сидирование завершено!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
