"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface Product {
  id: string;
  nameRu: string;
  nameEn: string;
  price: number;
  discountPrice: number | null;
  images: string[];
  isNew: boolean;
  category: { nameRu: string; nameEn: string };
}

interface Props {
  products: Product[];
  locale: string;
  prefix: string;
}

export default function FeaturedProducts({ products, locale, prefix }: Props) {
  const { addItem, openCart } = useCartStore();

  // Фолбэк-товары если БД пуста
  const fallback: Product[] = [
    {
      id: "1", nameRu: "Коврик «Лён»", nameEn: "Linen Rug",
      price: 1290, discountPrice: 990, isNew: false,
      images: ["https://images.unsplash.com/photo-1567538096630-e531b6a75c35?auto=format&fit=crop&w=600&q=80"],
      category: { nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
    },
    {
      id: "2", nameRu: "Коврик «Уют»", nameEn: "Cozy Rug",
      price: 1190, discountPrice: null, isNew: false,
      images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=600&q=80"],
      category: { nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
    },
    {
      id: "3", nameRu: "Набор ковриков 2 шт.", nameEn: "2-Piece Set",
      price: 2390, discountPrice: 1890, isNew: true,
      images: ["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80"],
      category: { nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
    },
    {
      id: "4", nameRu: "Коврик «Классик»", nameEn: "Classic Rug",
      price: 1390, discountPrice: null, isNew: false,
      images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80"],
      category: { nameRu: "Коврики для ванной", nameEn: "Bathroom Rugs" },
    },
  ];

  const items = products.length > 0 ? products : fallback;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px]">
      {items.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          locale={locale}
          prefix={prefix}
          onAddToCart={() => {
            addItem({
              id:        `${p.id}--`,
              productId: p.id,
              name:      locale === "ru" ? p.nameRu : p.nameEn,
              image:     p.images[0] ?? "",
              price:     p.discountPrice ?? p.price,
            });
            openCart();
          }}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product: p,
  locale,
  prefix,
  onAddToCart,
}: {
  product: Product;
  locale: string;
  prefix: string;
  onAddToCart: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const name = locale === "ru" ? p.nameRu : p.nameEn;
  const catName = locale === "ru" ? p.category.nameRu : p.category.nameEn;
  const hasDiscount = p.discountPrice !== null && p.discountPrice < p.price;
  const discountPct = hasDiscount
    ? Math.round((1 - p.discountPrice! / p.price) * 100)
    : 0;

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#F7F0EC] mb-4">
        {p.images[0] && (
          <img
            src={p.images[0]}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-600 ease-[cubic-bezier(.25,.46,.45,.94)] group-hover:scale-[1.06]"
          />
        )}

        {/* Badges */}
        {(hasDiscount || p.isNew) && (
          <span className="absolute top-3 left-3 text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 bg-[#3F1111] text-white">
            {hasDiscount ? `−${discountPct}%` : "Новинка"}
          </span>
        )}

        {/* Quick add */}
        <div
          className={`absolute bottom-0 left-0 right-0 px-4 py-3.5 bg-[#FAFAFA]/95 flex items-center justify-center gap-2 text-[11px] tracking-[0.16em] uppercase text-[#191E1B] transition-transform duration-350 ${
            hovered ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={(e) => { e.preventDefault(); onAddToCart(); }}
        >
          <ShoppingBag size={14} strokeWidth={1.5} />
          В корзину
        </div>
      </div>

      {/* Info */}
      <p className="font-prata text-[15px] mb-1.5 leading-[1.3]">{name}</p>
      <p className="text-[12px] text-[#9a9a9a] mb-2">{catName}</p>
      <p className="text-[14px]">
        {hasDiscount ? (
          <>
            <span className="text-[#9a9a9a] line-through text-[12px] mr-2">
              {p.price.toLocaleString("ru-RU")} ₽
            </span>
            <span className="text-[#3F1111]">
              {p.discountPrice!.toLocaleString("ru-RU")} ₽
            </span>
          </>
        ) : (
          <span>{p.price.toLocaleString("ru-RU")} ₽</span>
        )}
      </p>
    </div>
  );
}
