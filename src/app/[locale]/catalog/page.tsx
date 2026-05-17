import { Suspense } from "react";
import CatalogClient from "./CatalogClient";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import type { ProductWithCategory } from "@/components/shop/ProductModal";

interface SearchParams {
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  isNew?: string;
  isSale?: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

// Fetch ALL active products — filtering is done client-side so that
// unchecking a category filter shows all products, not just the initial set.
async function fetchProducts(_sp: SearchParams): Promise<ProductWithCategory[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { category: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return products.map((p: any) => ({
      id: p.id,
      sku: p.sku,
      nameRu: p.nameRu,
      nameEn: p.nameEn,
      descriptionRu: p.descriptionRu,
      descriptionEn: p.descriptionEn,
      price: p.price,
      discountPrice: p.discountPrice ?? null,
      images: Array.isArray(p.images) ? (p.images as string[]) : [],
      sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
      colors: (Array.isArray(p.colors) ? p.colors : []) as {
        name: string;
        nameEn: string;
        hex: string;
      }[],
      specsRu: (p.specsRu && typeof p.specsRu === "object"
        ? p.specsRu
        : {}) as Record<string, string>,
      specsEn: (p.specsEn && typeof p.specsEn === "object"
        ? p.specsEn
        : {}) as Record<string, string>,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      category: {
        id: p.category.id,
        slug: p.category.slug,
        nameRu: p.category.nameRu,
        nameEn: p.category.nameEn,
      },
    }));
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

async function fetchCategories() {
  try {
    const cats = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cats.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      nameRu: c.nameRu,
      nameEn: c.nameEn,
      image: c.image ?? null,
    }));
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const [products, categories] = await Promise.all([
    fetchProducts(sp), // sp передаётся для совместимости, фильтры — на клиенте
    fetchCategories(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
      <Navbar />
      <main className="pt-[72px]">
        <Suspense>
          <CatalogClient
            products={products}
            categories={categories}
            locale={locale}
            initialSearchParams={sp}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

// ── Static fallback data ──────────────────────────────────────────────────────

const FALLBACK_CATEGORIES = [
  {
    id: "c1",
    slug: "kovrik-dlya-vannoy",
    nameRu: "Коврики для ванной",
    nameEn: "Bathroom Rugs",
    image: null,
  },
  {
    id: "c2",
    slug: "polotenca",
    nameRu: "Полотенца",
    nameEn: "Towels",
    image: null,
  },
  {
    id: "c3",
    slug: "postelnoe-belyo",
    nameRu: "Постельное бельё",
    nameEn: "Bedding",
    image: null,
  },
];

const FALLBACK_PRODUCTS: ProductWithCategory[] = [
  {
    id: "1", sku: "AF-001",
    nameRu: "Коврик «Лён»", nameEn: "Linen Rug",
    descriptionRu: "Натуральный льняной коврик для ванной комнаты.",
    descriptionEn: "Natural linen bathroom rug.",
    price: 1290, discountPrice: 990,
    images: ["https://images.unsplash.com/photo-1567538096630-e531b6a75c35?auto=format&fit=crop&w=600&q=80"],
    sizes: ["50×80", "60×90"],
    colors: [{ name: "Бежевый", nameEn: "Beige", hex: "#F7F0EC" }],
    specsRu: { "Материал": "100% лён", "Уход": "Машинная стирка 40°" },
    specsEn: { "Material": "100% linen", "Care": "Machine wash 40°" },
    isNew: false, isFeatured: true,
    category: { id: "c1", slug: "kovrik-dlya-vannoy", nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
  },
  {
    id: "2", sku: "AF-002",
    nameRu: "Коврик «Уют»", nameEn: "Cozy Rug",
    descriptionRu: "Мягкий хлопковый коврик.",
    descriptionEn: "Soft cotton rug.",
    price: 1190, discountPrice: null,
    images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=600&q=80"],
    sizes: ["50×80"],
    colors: [{ name: "Белый", nameEn: "White", hex: "#FAFAFA" }],
    specsRu: { "Материал": "100% хлопок" },
    specsEn: { "Material": "100% cotton" },
    isNew: false, isFeatured: false,
    category: { id: "c1", slug: "kovrik-dlya-vannoy", nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
  },
  {
    id: "3", sku: "AF-003",
    nameRu: "Набор ковриков 2 шт.", nameEn: "2-Piece Set",
    descriptionRu: "Набор из двух ковриков.",
    descriptionEn: "Set of two rugs.",
    price: 2390, discountPrice: 1890,
    images: ["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80"],
    sizes: ["50×80 + 50×50"],
    colors: [{ name: "Бежевый", nameEn: "Beige", hex: "#F7F0EC" }],
    specsRu: { "В комплекте": "2 коврика" },
    specsEn: { "Includes": "2 rugs" },
    isNew: true, isFeatured: true,
    category: { id: "c1", slug: "kovrik-dlya-vannoy", nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
  },
  {
    id: "5", sku: "AF-005",
    nameRu: "Полотенце «Мягкость»", nameEn: "Softness Towel",
    descriptionRu: "Банное полотенце из египетского хлопка.",
    descriptionEn: "Bath towel from Egyptian cotton.",
    price: 890, discountPrice: null,
    images: ["https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80"],
    sizes: ["50×90", "70×140"],
    colors: [{ name: "Белый", nameEn: "White", hex: "#FAFAFA" }],
    specsRu: { "Материал": "Египетский хлопок" },
    specsEn: { "Material": "Egyptian cotton" },
    isNew: true, isFeatured: false,
    category: { id: "c2", slug: "polotenca", nameRu: "Полотенца", nameEn: "Towels" },
  },
  {
    id: "6", sku: "AF-006",
    nameRu: "Полотенце «Люкс»", nameEn: "Luxury Towel",
    descriptionRu: "Роскошное банное полотенце.",
    descriptionEn: "Luxury bath towel.",
    price: 1290, discountPrice: 990,
    images: ["https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80"],
    sizes: ["70×140", "100×150"],
    colors: [{ name: "Серый", nameEn: "Gray", hex: "#9a9a9a" }],
    specsRu: { "Материал": "100% хлопок" },
    specsEn: { "Material": "100% cotton" },
    isNew: false, isFeatured: true,
    category: { id: "c2", slug: "polotenca", nameRu: "Полотенца", nameEn: "Towels" },
  },
];
