import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, RefreshCw, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryShowcase, {
  type ShowcaseCategory,
} from "@/components/shop/CategoryShowcase";
import NewsletterForm from "@/components/shop/NewsletterForm";
import { prisma } from "@/lib/prisma";

// ── DB fetch ──────────────────────────────────────────────────────────────────
async function getPageData() {
  // categories + 3 featured products each
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        take: 3,
      },
    },
  });
  return cats;
}

// ── Static fallback (DB unavailable) ─────────────────────────────────────────
const FALLBACK: ShowcaseCategory[] = [
  {
    id: "c1",
    slug: "kovrik-dlya-vannoy",
    nameRu: "Коврики для ванной",
    nameEn: "Bathroom Rugs",
    image:
      "https://images.unsplash.com/photo-1567538096630-e531b6a75c35?auto=format&fit=crop&w=900&q=80",
    products: [
      {
        id: "p1", sku: "AF-001",
        nameRu: "Коврик «Лён»", nameEn: "Linen Rug",
        descriptionRu: "Натуральный льняной коврик для ванной.",
        descriptionEn: "Natural linen bathroom rug.",
        price: 1290, discountPrice: 990,
        images: ["https://images.unsplash.com/photo-1567538096630-e531b6a75c35?auto=format&fit=crop&w=600&q=80"],
        sizes: ["50×80", "60×90"], colors: [],
        specsRu: { "Материал": "100% лён" }, specsEn: { "Material": "100% linen" },
        isNew: false, isFeatured: true,
        category: { id: "c1", slug: "kovrik-dlya-vannoy", nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
      },
      {
        id: "p2", sku: "AF-002",
        nameRu: "Коврик «Уют»", nameEn: "Cozy Rug",
        descriptionRu: "Мягкий хлопковый коврик.", descriptionEn: "Soft cotton rug.",
        price: 1190, discountPrice: null,
        images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=600&q=80"],
        sizes: ["50×80"], colors: [],
        specsRu: { "Материал": "100% хлопок" }, specsEn: { "Material": "100% cotton" },
        isNew: false, isFeatured: false,
        category: { id: "c1", slug: "kovrik-dlya-vannoy", nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
      },
      {
        id: "p3", sku: "AF-003",
        nameRu: "Набор ковриков 2 шт.", nameEn: "2-Piece Set",
        descriptionRu: "Набор из двух ковриков.", descriptionEn: "Set of two rugs.",
        price: 2390, discountPrice: 1890,
        images: ["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80"],
        sizes: ["50×80 + 50×50"], colors: [],
        specsRu: { "В комплекте": "2 коврика" }, specsEn: { "Includes": "2 rugs" },
        isNew: true, isFeatured: true,
        category: { id: "c1", slug: "kovrik-dlya-vannoy", nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
      },
    ],
  },
  {
    id: "c2",
    slug: "polotenca",
    nameRu: "Полотенца",
    nameEn: "Towels",
    image:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=900&q=80",
    products: [
      {
        id: "p5", sku: "AF-005",
        nameRu: "Полотенце «Мягкость»", nameEn: "Softness Towel",
        descriptionRu: "Банное полотенце из египетского хлопка.",
        descriptionEn: "Bath towel from Egyptian cotton.",
        price: 890, discountPrice: null,
        images: ["https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80"],
        sizes: ["50×90", "70×140"], colors: [],
        specsRu: { "Материал": "Египетский хлопок" }, specsEn: { "Material": "Egyptian cotton" },
        isNew: true, isFeatured: false,
        category: { id: "c2", slug: "polotenca", nameRu: "Полотенца", nameEn: "Towels" },
      },
      {
        id: "p6", sku: "AF-006",
        nameRu: "Полотенце «Люкс»", nameEn: "Luxury Towel",
        descriptionRu: "Роскошное банное полотенце.", descriptionEn: "Luxury bath towel.",
        price: 1290, discountPrice: 990,
        images: ["https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80"],
        sizes: ["70×140", "100×150"], colors: [],
        specsRu: { "Материал": "100% хлопок" }, specsEn: { "Material": "100% cotton" },
        isNew: false, isFeatured: true,
        category: { id: "c2", slug: "polotenca", nameRu: "Полотенца", nameEn: "Towels" },
      },
      {
        id: "p7", sku: "AF-007",
        nameRu: "Полотенце «Премиум»", nameEn: "Premium Towel",
        descriptionRu: "Плотное махровое полотенце.", descriptionEn: "Dense terry towel.",
        price: 1590, discountPrice: null,
        images: ["https://images.unsplash.com/photo-1584545284372-f22510eb7c26?auto=format&fit=crop&w=600&q=80"],
        sizes: ["70×140"], colors: [],
        specsRu: { "Плотность": "700 г/м²" }, specsEn: { "Density": "700 g/m²" },
        isNew: false, isFeatured: false,
        category: { id: "c2", slug: "polotenca", nameRu: "Полотенца", nameEn: "Towels" },
      },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const t      = await getTranslations();
  const locale = await getLocale();
  const prefix = locale === "ru" ? "" : "/en";
  const isRu   = locale === "ru";

  // Read hero + banner settings from DB
  const settingRows = await prisma.integration.findMany({
    where: { key: { in: [
      "hero_type", "hero_url",
      "banner_image", "banner_tag", "banner_title_1", "banner_title_2",
      "banner_subtitle", "banner_cta",
    ] } },
  });
  const s: Record<string, string> = {};
  for (const r of settingRows) s[r.key] = r.value;

  const heroType = s["hero_type"] ?? "video";
  const heroUrl  = s["hero_url"]  ?? "/dacha-desk.mp4";

  const bannerImage    = s["banner_image"]    ?? "https://images.unsplash.com/photo-1618220048045-10a6dbdf53e0?auto=format&fit=crop&w=1920&q=80";
  const bannerTag      = s["banner_tag"]      ?? "Весна · Лето 2026";
  const bannerTitle1   = s["banner_title_1"]  ?? "Новая коллекция";
  const bannerTitle2   = s["banner_title_2"]  ?? "уже в каталоге";
  const bannerSubtitle = s["banner_subtitle"] ?? "Скидки до 30% на выбранные позиции";
  const bannerCta      = s["banner_cta"]      ?? "Смотреть каталог";

  // Fetch categories with products from DB (graceful fallback)
  let showcaseCategories: ShowcaseCategory[] = FALLBACK;
  try {
    const dbCats = await getPageData();
    if (dbCats.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      showcaseCategories = dbCats.map((cat: any) => ({
        id: cat.id,
        slug: cat.slug,
        nameRu: cat.nameRu,
        nameEn: cat.nameEn,
        image: cat.image ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        products: cat.products.map((p: any) => ({
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
          colors: (Array.isArray(p.colors)
            ? p.colors
            : []) as { name: string; nameEn: string; hex: string }[],
          specsRu: (p.specsRu && typeof p.specsRu === "object"
            ? p.specsRu
            : {}) as Record<string, string>,
          specsEn: (p.specsEn && typeof p.specsEn === "object"
            ? p.specsEn
            : {}) as Record<string, string>,
          isNew: p.isNew,
          isFeatured: p.isFeatured,
          category: {
            id: cat.id,
            slug: cat.slug,
            nameRu: cat.nameRu,
            nameEn: cat.nameEn,
          },
        })),
      }));
    }
  } catch {
    // DB unavailable — use static fallback
  }

  // Editorial category mosaic — все активные категории
  const mosaicCats = showcaseCategories;

  const marqueeItems = [
    "Бесплатная доставка от 3 000 ₽",
    "Более 300 товаров",
    "Доставка по всей России",
    "Возврат 14 дней",
    "Оплата при получении",
  ];

  return (
    <>
      <Navbar transparent />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          {heroType === "video" ? (
            <video autoPlay muted loop playsInline preload="auto" className="w-full h-full object-cover scale-[1.02]">
              <source src={heroUrl} type="video/mp4" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt="Главная страница" className="w-full h-full object-cover scale-[1.02]" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#191E1B]/20 via-transparent to-[#191E1B]/60" />

        <div className="absolute bottom-12 left-6 right-6 sm:bottom-20 sm:left-16 sm:right-auto max-w-[520px]">
          <p className="text-[11px] tracking-[0.24em] uppercase text-white/70 mb-4">
            {t("hero.tag")}
          </p>
          <h1 className="font-prata text-[clamp(30px,7vw,60px)] leading-[1.1] text-white mb-8 whitespace-pre-line">
            {t("hero.title")}
          </h1>
          <Link
            href={`${prefix}/catalog`}
            className="inline-flex items-center gap-3 text-[12px] tracking-[0.2em] uppercase text-white border-b border-white/40 pb-1.5 hover:border-white hover:gap-5 transition-all duration-300"
          >
            {t("hero.cta")}
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="hidden sm:flex absolute bottom-8 right-12 flex-col items-center gap-2 text-white/50">
          <div className="w-[1px] h-12 bg-white/30 animate-pulse" />
          <span className="text-[9px] tracking-[0.22em] uppercase">Scroll</span>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-y py-3"
        style={{ background: "#F7F0EC", borderColor: "#e8e0da" }}
      >
        <div className="flex w-max animate-marquee">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-8 px-8 text-[11px] tracking-[0.2em] uppercase whitespace-nowrap"
              style={{ color: "rgba(25,30,27,0.55)" }}
            >
              {item}
              <span style={{ color: "rgba(25,30,27,0.2)" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── EDITORIAL CATEGORY MOSAIC ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-[2px] md:min-h-[480px]">
        {/* Первая карточка — широкая */}
        {mosaicCats[0] && (() => {
          const cat = mosaicCats[0];
          const name = isRu ? cat.nameRu : cat.nameEn;
          const imgSrc = cat.image ?? "https://images.unsplash.com/photo-1567538096630-e531b6a75c35?auto=format&fit=crop&w=900&q=80";
          return (
            <Link
              key={cat.id}
              href={`${prefix}/catalog?category=${cat.slug}`}
              className="group relative overflow-hidden flex-shrink-0 w-full min-h-[320px] md:min-h-[480px] md:flex-[0_0_42%]"
              style={{ background: "#F7F0EC" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#191E1B]/60 via-transparent to-transparent group-hover:from-[#191E1B]/70 transition-all duration-400" />
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <h2 className="font-prata text-[20px] text-white mb-3 leading-[1.2]">{name}</h2>
                <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-white/80 border-b border-white/30 pb-1 group-hover:gap-3.5 group-hover:border-white/70 transition-all duration-300">
                  Смотреть <ArrowRight size={12} strokeWidth={1.5} />
                </span>
              </div>
            </Link>
          );
        })()}

        {/* Остальные — равномерная сетка справа */}
        {mosaicCats.length > 1 && (
          <div
            className={`grid gap-[2px] flex-1 auto-rows-[200px] sm:auto-rows-[240px] md:auto-rows-fr ${
              mosaicCats.length - 1 <= 2 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {mosaicCats.slice(1).map((cat, i) => {
              const name = isRu ? cat.nameRu : cat.nameEn;
              const fallbacks = [
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80",
                "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=900&q=80",
                "https://images.unsplash.com/photo-1618220048045-10a6dbdf53e0?auto=format&fit=crop&w=900&q=80",
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd3?auto=format&fit=crop&w=900&q=80",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
              ];
              const imgSrc = cat.image ?? fallbacks[i % fallbacks.length];
              return (
                <Link
                  key={cat.id}
                  href={`${prefix}/catalog?category=${cat.slug}`}
                  className="group relative overflow-hidden"
                  style={{ background: "#F7F0EC" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgSrc} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#191E1B]/60 via-transparent to-transparent group-hover:from-[#191E1B]/70 transition-all duration-400" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="font-prata text-[16px] text-white mb-2 leading-[1.2]">{name}</h2>
                    <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.16em] uppercase text-white/80 border-b border-white/30 pb-1 group-hover:gap-3 group-hover:border-white/70 transition-all duration-300">
                      Смотреть <ArrowRight size={11} strokeWidth={1.5} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CATEGORY SHOWCASE (3 products per category) ───────────────────── */}
      <CategoryShowcase
        categories={showcaseCategories}
        locale={locale}
        prefix={prefix}
      />

      {/* ── BRAND STORY ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[540px]">
        <div className="relative overflow-hidden min-h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80"
            alt="История бренда"
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className="flex flex-col justify-center px-6 sm:px-12 md:px-16 py-16 md:py-20"
          style={{ background: "#F7F0EC" }}
        >
          <p
            className="text-[10px] tracking-[0.28em] uppercase mb-5"
            style={{ color: "#9a9a9a" }}
          >
            {t("story.label")}
          </p>
          <blockquote
            className="font-prata text-[clamp(18px,2.2vw,28px)] leading-[1.45] mb-8"
            style={{ color: "#191E1B" }}
          >
            «{t("story.quote")}»
          </blockquote>
          <p className="text-[14px] leading-[1.8] mb-4" style={{ color: "#555" }}>
            {t("story.text1")}
          </p>
          <p className="text-[14px] leading-[1.8] mb-10" style={{ color: "#555" }}>
            {t("story.text2")}
          </p>
          <Link
            href={`${prefix}/catalog`}
            className="inline-flex items-center gap-3 text-[12px] tracking-[0.18em] uppercase px-8 py-4 w-max hover:gap-5 transition-all duration-300"
            style={{ background: "#191E1B", color: "#FAFAFA" }}
          >
            {t("story.cta")}
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* ── WIDE BANNER ───────────────────────────────────────────────────── */}
      <div className="relative h-[360px] sm:h-[460px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerImage}
          alt="Коллекция"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          style={{ background: "rgba(25,30,27,0.45)" }}
        >
          <p
            className="text-[10px] tracking-[0.28em] uppercase mb-4"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {bannerTag}
          </p>
          <h2
            className="font-prata text-[clamp(26px,4vw,50px)] leading-[1.15] mb-3 max-w-[620px]"
            style={{ color: "#fff" }}
          >
            {bannerTitle1}
            <br />
            {bannerTitle2}
          </h2>
          <p
            className="text-[13px] tracking-[0.08em] mb-9"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {bannerSubtitle}
          </p>
          <Link
            href={`${prefix}/catalog`}
            className="inline-flex items-center gap-3 text-[12px] tracking-[0.18em] uppercase border px-9 py-4 hover:gap-5 transition-all duration-300"
            style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
          >
            {bannerCta}
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* ── FEATURES STRIP ────────────────────────────────────────────────── */}
      <div className="py-16 px-6 md:px-12" style={{ background: "#191E1B" }}>
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">
          {(["delivery", "quality", "return", "support"] as const).map(
            (key, i) => (
              <div
                key={key}
                className={`text-center px-4 ${i < 3 ? "md:border-r" : ""}`}
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div className="mb-4 flex justify-center opacity-60">
                  {key === "delivery" && <Truck size={22} strokeWidth={1.5} color="white" />}
                  {key === "quality"  && <ShieldCheck size={22} strokeWidth={1.5} color="white" />}
                  {key === "return"   && <RefreshCw size={22} strokeWidth={1.5} color="white" />}
                  {key === "support"  && <MessageCircle size={22} strokeWidth={1.5} color="white" />}
                </div>
                <p className="font-prata text-[15px] text-white mb-2">
                  {t(`features.${key}.title`)}
                </p>
                <p
                  className="text-[12px] leading-[1.7]"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {t(`features.${key}.text`)}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
