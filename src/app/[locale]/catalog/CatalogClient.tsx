"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal, X, ChevronDown, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import ProductModal, { type ProductWithCategory } from "@/components/shop/ProductModal";

interface Category {
  id: string;
  nameRu: string;
  nameEn: string;
  slug: string;
  image?: string | null;
}

interface Product extends ProductWithCategory {}

interface Props {
  products: Product[];
  categories: Category[];
  locale: string;
  initialSearchParams: {
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    isNew?: string;
    isSale?: string;
  };
}

type SortKey = "new" | "priceAsc" | "priceDesc" | "popular";

const SORT_LABELS: Record<SortKey, string> = {
  new: "Новинки",
  priceAsc: "Сначала дешевле",
  priceDesc: "Сначала дороже",
  popular: "Популярные",
};

export default function CatalogClient({
  products,
  categories,
  locale,
  initialSearchParams,
}: Props) {
  const { addItem, openCart } = useCartStore();
  const isRu = locale === "ru";

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialSearchParams.category ? [initialSearchParams.category] : []
  );
  const [sort, setSort] = useState<SortKey>(
    (initialSearchParams.sort as SortKey) ?? "new"
  );
  const [minPrice, setMinPrice] = useState(initialSearchParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initialSearchParams.maxPrice ?? "");
  const [filterNew, setFilterNew] = useState(
    initialSearchParams.isNew === "true"
  );
  const [filterSale, setFilterSale] = useState(
    initialSearchParams.isSale === "true"
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Client-side filtering & sorting
  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategories.length > 0) {
      result = result.filter(
        (p) =>
          selectedCategories.includes(p.category.slug) ||
          selectedCategories.includes(p.category.id)
      );
    }
    if (filterNew) result = result.filter((p) => p.isNew);
    if (filterSale) result = result.filter((p) => p.discountPrice !== null);
    if (minPrice)
      result = result.filter(
        (p) => (p.discountPrice ?? p.price) >= Number(minPrice)
      );
    if (maxPrice)
      result = result.filter(
        (p) => (p.discountPrice ?? p.price) <= Number(maxPrice)
      );

    switch (sort) {
      case "priceAsc":
        result.sort(
          (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
        );
        break;
      case "priceDesc":
        result.sort(
          (a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)
        );
        break;
      case "new":
        result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      default:
        result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }

    return result;
  }, [
    products,
    selectedCategories,
    sort,
    minPrice,
    maxPrice,
    filterNew,
    filterSale,
  ]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setFilterNew(false);
    setFilterSale(false);
    setSort("new");
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || filterNew || filterSale || minPrice || maxPrice;

  // Active category name for page header
  const activeCat =
    selectedCategories.length === 1
      ? categories.find((c) => c.slug === selectedCategories[0])
      : null;

  const pageTitle = activeCat
    ? isRu
      ? activeCat.nameRu
      : activeCat.nameEn
    : isRu
    ? "Все товары"
    : "All Products";

  // ── Sidebar JSX ───────────────────────────────────────────────────────────
  // ВАЖНО: не функция-компонент, а обычная переменная с JSX —
  // иначе React при каждом ре-рендере создаёт новый тип компонента,
  // анмаунтит его и инпуты теряют фокус.
  const sidebarJsx = (
    <aside className="w-full md:w-52 flex-shrink-0 space-y-8">
      {/* Categories */}
      <div>
        <p
          className="text-[10px] tracking-[0.22em] uppercase mb-3"
          style={{ color: "#9a9a9a" }}
        >
          Категории
        </p>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setSelectedCategories([])}
              className="text-[13px] w-full text-left transition-colors"
              style={{
                color: selectedCategories.length === 0 ? "#3F1111" : "#9a9a9a",
                fontWeight: selectedCategories.length === 0 ? 500 : 400,
              }}
            >
              Все товары
            </button>
          </li>
          {categories.map((cat) => {
            const active = selectedCategories.includes(cat.slug);
            return (
              <li key={cat.id}>
                <button
                  onClick={() => toggleCategory(cat.slug)}
                  className="text-[13px] w-full text-left flex items-center gap-2 transition-colors"
                  style={{
                    color: active ? "#3F1111" : "#9a9a9a",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center transition-colors"
                    style={{
                      border: active ? "1px solid #3F1111" : "1px solid #e8e0da",
                      background: active ? "#3F1111" : "transparent",
                    }}
                  >
                    {active && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path
                          d="M1 3L3 5L7 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {isRu ? cat.nameRu : cat.nameEn}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price */}
      <div>
        <p
          className="text-[10px] tracking-[0.22em] uppercase mb-3"
          style={{ color: "#9a9a9a" }}
        >
          Цена, ₽
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="От"
            className="w-full px-2 py-1.5 text-[12px] outline-none transition-colors bg-transparent"
            style={{ border: "1px solid #e8e0da", color: "#191E1B" }}
          />
          <span className="text-[12px]" style={{ color: "#9a9a9a" }}>—</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="До"
            className="w-full px-2 py-1.5 text-[12px] outline-none transition-colors bg-transparent"
            style={{ border: "1px solid #e8e0da", color: "#191E1B" }}
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {(
          [
            { key: "new",  label: "Новинки", val: filterNew,  set: setFilterNew  },
            { key: "sale", label: "Скидки",  val: filterSale, set: setFilterSale },
          ] as const
        ).map(({ key, label, val, set }) => (
          <label
            key={key}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => (set as (v: boolean) => void)(!val)}
          >
            <span
              className="w-8 h-4 rounded-full relative flex-shrink-0 transition-colors"
              style={{ background: val ? "#3F1111" : "#e8e0da" }}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                style={{ transform: val ? "translateX(16px)" : "translateX(2px)" }}
              />
            </span>
            <span className="text-[13px] transition-colors" style={{ color: val ? "#191E1B" : "#9a9a9a" }}>
              {label}
            </span>
          </label>
        ))}
      </div>

      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase transition-opacity hover:opacity-70"
          style={{ color: "#3F1111" }}
        >
          <X size={12} />
          Сбросить
        </button>
      )}
    </aside>
  );

  return (
    <div>
      {/* ── Category banner (when one category selected with image) ── */}
      {activeCat?.image && (
        <div className="relative h-40 sm:h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeCat.image}
            alt={pageTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#191E1B]/60 to-transparent flex items-end px-6 sm:px-10 pb-6 sm:pb-8">
            <h1 className="font-prata text-[26px] sm:text-[36px] text-white">{pageTitle}</h1>
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        {/* Header (no banner or all products) */}
        {!activeCat?.image && (
          <div className="mb-8">
            <p
              className="text-[10px] tracking-[0.28em] uppercase mb-2"
              style={{ color: "#9a9a9a" }}
            >
              Каталог
            </p>
            <h1
              className="font-prata text-[32px] md:text-[40px]"
              style={{ color: "#191E1B" }}
            >
              {pageTitle}
            </h1>
          </div>
        )}

        {/* Mobile filter toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase px-4 py-2.5"
            style={{
              color: "#191E1B",
              border: "1px solid #e8e0da",
            }}
          >
            <SlidersHorizontal size={14} strokeWidth={1.5} />
            Фильтры
            {hasActiveFilters && (
              <span
                className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center"
                style={{ background: "#3F1111" }}
              >
                {selectedCategories.length +
                  (filterNew ? 1 : 0) +
                  (filterSale ? 1 : 0)}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div
              className="mt-4 p-5"
              style={{ border: "1px solid #e8e0da", background: "#F7F0EC" }}
            >
              {sidebarJsx}
            </div>
          )}
        </div>

        {/* Desktop layout: sidebar + grid */}
        <div className="flex gap-12">
          <div className="hidden md:block">
            {sidebarJsx}
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Top bar */}
            <div
              className="flex items-center justify-between mb-6 pb-4"
              style={{ borderBottom: "1px solid #e8e0da" }}
            >
              <p className="text-[12px]" style={{ color: "#9a9a9a" }}>
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "товар"
                  : filtered.length < 5
                  ? "товара"
                  : "товаров"}
              </p>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="appearance-none bg-transparent text-[12px] tracking-[0.08em] pr-6 pb-1 outline-none cursor-pointer transition-colors"
                  style={{
                    color: "#191E1B",
                    borderBottom: "1px solid #e8e0da",
                  }}
                >
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-0 bottom-1.5 pointer-events-none"
                  style={{ color: "#9a9a9a" }}
                />
              </div>
            </div>

            {/* Product grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <p
                  className="font-prata text-[20px] mb-3"
                  style={{ color: "#191E1B" }}
                >
                  Товары не найдены
                </p>
                <p
                  className="text-[13px] mb-6"
                  style={{ color: "#9a9a9a" }}
                >
                  Попробуйте изменить параметры фильтрации
                </p>
                <button
                  onClick={resetFilters}
                  className="text-[11px] tracking-[0.16em] uppercase border-b pb-0.5 transition-opacity hover:opacity-70"
                  style={{ color: "#3F1111", borderColor: "#3F1111" }}
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    onClick={() => setSelectedProduct(product)}
                    onAddToCart={() => {
                      addItem({
                        id: `${product.id}--`,
                        productId: product.id,
                        name: isRu ? product.nameRu : product.nameEn,
                        image: product.images[0] ?? "",
                        price: product.discountPrice ?? product.price,
                      });
                      openCart();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        locale={locale}
      />
      {/* CartDrawer is already in layout via CartDrawerWrapper — no need to re-add here */}
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({
  product: p,
  locale,
  onClick,
  onAddToCart,
}: {
  product: Product;
  locale: string;
  onClick: () => void;
  onAddToCart: () => void;
}) {
  const isRu = locale === "ru";
  const name = isRu ? p.nameRu : p.nameEn;
  const catName = isRu ? p.category.nameRu : p.category.nameEn;
  const hasDiscount = p.discountPrice !== null && p.discountPrice < p.price;
  const discountPct = hasDiscount
    ? Math.round((1 - p.discountPrice! / p.price) * 100)
    : 0;

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      {/* Image */}
      <div
        className="relative overflow-hidden aspect-[3/4] mb-4"
        style={{ background: "#F7F0EC" }}
      >
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.images[0]}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(.25,.46,.45,.94)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "#e8e0da" }} />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {p.isNew && (
            <span
              className="text-[9px] tracking-[0.14em] uppercase px-2 py-0.5"
              style={{ background: "#191E1B", color: "#fff" }}
            >
              Новинка
            </span>
          )}
          {hasDiscount && (
            <span
              className="text-[9px] tracking-[0.14em] uppercase px-2 py-0.5"
              style={{ background: "#3F1111", color: "#fff" }}
            >
              −{discountPct}%
            </span>
          )}
        </div>

        {/* Quick add */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-center gap-2 text-[10px] tracking-[0.16em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          style={{ background: "rgba(250,250,250,0.95)", color: "#191E1B" }}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
        >
          <ShoppingBag size={13} strokeWidth={1.5} />
          В корзину
        </div>
      </div>

      {/* Info */}
      <p
        className="font-prata text-[15px] mb-1 leading-snug"
        style={{ color: "#191E1B" }}
      >
        {name}
      </p>
      <p className="text-[11px] mb-2" style={{ color: "#9a9a9a" }}>
        {catName}
      </p>
      <p className="text-[13px]">
        {hasDiscount ? (
          <>
            <span
              className="line-through text-[11px] mr-2"
              style={{ color: "#9a9a9a" }}
            >
              {p.price.toLocaleString("ru-RU")} ₽
            </span>
            <span style={{ color: "#3F1111", fontWeight: 500 }}>
              {p.discountPrice!.toLocaleString("ru-RU")} ₽
            </span>
          </>
        ) : (
          <span style={{ color: "#191E1B" }}>
            {p.price.toLocaleString("ru-RU")} ₽
          </span>
        )}
      </p>
    </div>
  );
}
