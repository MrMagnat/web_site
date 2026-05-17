"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import ProductModal, { type ProductWithCategory } from "@/components/shop/ProductModal";

export interface ShowcaseCategory {
  id: string;
  slug: string;
  nameRu: string;
  nameEn: string;
  image?: string | null;
  products: ProductWithCategory[];
}

interface Props {
  categories: ShowcaseCategory[];
  locale: string;
  prefix: string;
}

export default function CategoryShowcase({ categories, locale, prefix }: Props) {
  const { addItem, openCart } = useCartStore();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const isRu = locale === "ru";

  const visible = categories.filter((c) => c.products.length > 0);
  if (!visible.length) return null;

  return (
    <section className="bg-[#FAFAFA] px-6 md:px-12 py-20">
      <div className="max-w-[1400px] mx-auto">

        {/* Section title */}
        <div className="mb-14">
          <p
            className="text-[10px] tracking-[0.28em] uppercase mb-4"
            style={{ color: "#9a9a9a" }}
          >
            Коллекции
          </p>
          <h2 className="font-prata text-[32px] leading-[1.2]" style={{ color: "#191E1B" }}>
            Выбирайте{" "}
            <em className="not-italic" style={{ color: "#3F1111" }}>
              по категориям
            </em>
          </h2>
        </div>

        {/* One block per category */}
        <div className="flex flex-col gap-16">
          {visible.map((cat) => {
            const catName = isRu ? cat.nameRu : cat.nameEn;

            return (
              <div key={cat.id}>
                {/* Category header */}
                <div
                  className="flex items-center justify-between mb-7 pb-4 border-b"
                  style={{ borderColor: "#e8e0da" }}
                >
                  <h3
                    className="font-prata text-[22px] leading-tight"
                    style={{ color: "#191E1B" }}
                  >
                    {catName}
                  </h3>
                  <Link
                    href={`${prefix}/catalog?category=${cat.slug}`}
                    className="group inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase border-b pb-0.5 transition-all duration-200 hover:gap-3.5"
                    style={{ color: "#9a9a9a", borderColor: "#e8e0da" }}
                  >
                    Смотреть все
                    <ArrowRight size={11} strokeWidth={1.5} />
                  </Link>
                </div>

                {/* 3 product cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-7">
                  {cat.products.slice(0, 3).map((product) => (
                    <ShowcaseCard
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
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Link
            href={`${prefix}/catalog`}
            className="inline-flex items-center gap-3 text-[12px] tracking-[0.18em] uppercase px-10 py-4 transition-all duration-300 hover:gap-5"
            style={{ background: "#191E1B", color: "#FAFAFA" }}
          >
            Весь каталог
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Product modal — shared for all categories */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        locale={locale}
      />
    </section>
  );
}

// ── Single product card ────────────────────────────────────────────────────────

function ShowcaseCard({
  product: p,
  locale,
  onClick,
  onAddToCart,
}: {
  product: ProductWithCategory;
  locale: string;
  onClick: () => void;
  onAddToCart: () => void;
}) {
  const isRu = locale === "ru";
  const name = isRu ? p.nameRu : p.nameEn;
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

        {/* Quick-add — slides up on hover */}
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
      <p className="font-prata text-[15px] mb-1 leading-snug" style={{ color: "#191E1B" }}>
        {name}
      </p>
      <p className="text-[12px] mb-2" style={{ color: "#9a9a9a" }}>
        {isRu ? p.category.nameRu : p.category.nameEn}
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
            <span style={{ color: "#3F1111" }}>
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
