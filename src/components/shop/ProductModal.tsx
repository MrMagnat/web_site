"use client";
import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface ProductCategory {
  id: string;
  nameRu: string;
  nameEn: string;
  slug: string;
}

export interface ProductWithCategory {
  id: string;
  sku: string;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  price: number;
  discountPrice: number | null;
  images: string[];
  sizes: string[];
  colors: { name: string; nameEn: string; hex: string }[];
  specsRu: Record<string, string>;
  specsEn: Record<string, string>;
  isNew: boolean;
  isFeatured: boolean;
  category: ProductCategory;
  collectionSlug?: string | null;
}

interface Props {
  product: ProductWithCategory | null;
  onClose: () => void;
  locale: string;
}

export default function ProductModal({ product, onClose, locale }: Props) {
  const { addItem, openCart } = useCartStore();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const isRu = locale === "ru";

  // Reset state + track view when product changes
  useEffect(() => {
    if (product) {
      setActiveImage(0);
      setSelectedSize(product.sizes[0] ?? null);
      setSelectedColor(product.colors[0]?.name ?? null);
      setSpecsOpen(false);
      setAdded(false);

      // Record a view (fire-and-forget)
      fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      }).catch(() => {/* silent */});
    }
  }, [product?.id]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [product, onClose]);

  // Lock scroll
  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  const prevImage = useCallback(() => {
    if (!product) return;
    setActiveImage((i) => (i - 1 + product.images.length) % product.images.length);
  }, [product]);

  const nextImage = useCallback(() => {
    if (!product) return;
    setActiveImage((i) => (i + 1) % product.images.length);
  }, [product]);

  if (!product) return null;

  const name = isRu ? product.nameRu : product.nameEn;
  const description = isRu ? product.descriptionRu : product.descriptionEn;
  const specs = isRu ? product.specsRu : product.specsEn;
  const catName = isRu ? product.category.nameRu : product.category.nameEn;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.discountPrice! / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${selectedSize ?? ""}-${selectedColor ?? ""}`,
      productId: product.id,
      name,
      image: product.images[0] ?? "",
      price: product.discountPrice ?? product.price,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
    });

    // Track cart add (fire-and-forget)
    fetch("/api/analytics/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => {/* silent */});

    setAdded(true);
    // Close modal and open cart drawer after brief feedback
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 600);
    openCart();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onClick={onClose}
      >
        <div
          className="relative bg-[#FAFAFA] w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-[#FAFAFA]/90 text-[#9a9a9a] hover:text-[#191E1B] transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} strokeWidth={1.5} />
          </button>

          <div className="grid md:grid-cols-2">
            {/* Left: Images */}
            <div className="bg-[#F7F0EC]">
              {/* Main image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[activeImage]}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#e8e0da]" />
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.isNew && (
                    <span className="text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 bg-[#191E1B] text-white">
                      Новинка
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 bg-[#3F1111] text-white">
                      −{discountPct}%
                    </span>
                  )}
                </div>

                {/* Arrow navigation */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#FAFAFA]/80 text-[#191E1B] hover:bg-[#FAFAFA] transition-colors"
                      aria-label="Предыдущее фото"
                    >
                      <ChevronLeft size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#FAFAFA]/80 text-[#191E1B] hover:bg-[#FAFAFA] transition-colors"
                      aria-label="Следующее фото"
                    >
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-14 h-14 overflow-hidden border-2 transition-colors ${
                        i === activeImage ? "border-[#3F1111]" : "border-transparent hover:border-[#9a9a9a]"
                      }`}
                      aria-label={`Фото ${i + 1}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="p-7 md:p-8 flex flex-col gap-5 overflow-y-auto">
              {/* Category & SKU */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.22em] uppercase text-[#9a9a9a]">
                  {catName}
                </span>
                <span className="text-[10px] tracking-[0.16em] text-[#9a9a9a]">
                  SKU: {product.sku}
                </span>
              </div>

              {/* Name */}
              <h2 className="font-prata text-[22px] leading-tight text-[#191E1B]">
                {name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {hasDiscount ? (
                  <>
                    <span className="font-prata text-[24px] text-[#3F1111]">
                      {product.discountPrice!.toLocaleString("ru-RU")} ₽
                    </span>
                    <span className="text-[14px] text-[#9a9a9a] line-through">
                      {product.price.toLocaleString("ru-RU")} ₽
                    </span>
                  </>
                ) : (
                  <span className="font-prata text-[24px] text-[#191E1B]">
                    {product.price.toLocaleString("ru-RU")} ₽
                  </span>
                )}
              </div>

              {/* Description */}
              {description && (
                <p className="text-[13px] text-[#9a9a9a] leading-relaxed">
                  {description}
                </p>
              )}

              {/* Size selector */}
              {product.sizes.length > 0 && (
                <div>
                  <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-2.5">
                    Размер
                    {selectedSize && (
                      <span className="ml-2 text-[#191E1B] normal-case tracking-normal">
                        {selectedSize}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-1.5 border text-[12px] tracking-[0.06em] transition-colors ${
                          selectedSize === size
                            ? "border-[#3F1111] bg-[#3F1111] text-white"
                            : "border-[#e8e0da] text-[#191E1B] hover:border-[#9a9a9a]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selector */}
              {product.colors.length > 0 && (
                <div>
                  <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-2.5">
                    Цвет
                    {selectedColor && (
                      <span className="ml-2 text-[#191E1B] normal-case tracking-normal">
                        {isRu
                          ? product.colors.find((c) => c.name === selectedColor)?.name
                          : product.colors.find((c) => c.name === selectedColor)?.nameEn}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        title={isRu ? color.name : color.nameEn}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          selectedColor === color.name
                            ? "border-[#3F1111] scale-110"
                            : "border-transparent hover:border-[#9a9a9a]"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        aria-label={isRu ? color.name : color.nameEn}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Specs accordion */}
              {Object.keys(specs).length > 0 && (
                <div className="border-t border-[#e8e0da] pt-4">
                  <button
                    onClick={() => setSpecsOpen(!specsOpen)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-[11px] tracking-[0.18em] uppercase text-[#191E1B]">
                      Характеристики
                    </span>
                    <span className="text-[#9a9a9a] text-[18px] leading-none">
                      {specsOpen ? "−" : "+"}
                    </span>
                  </button>
                  {specsOpen && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(specs).map(([key, val]) => (
                        <div key={key} className="flex gap-4 text-[12px]">
                          <span className="text-[#9a9a9a] w-32 flex-shrink-0">{key}</span>
                          <span className="text-[#191E1B]">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="mt-auto pt-2">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-3.5 text-[12px] tracking-[0.18em] uppercase transition-colors ${
                    added
                      ? "bg-[#191E1B] text-white"
                      : "bg-[#3F1111] text-white hover:bg-[#5a1a1a]"
                  }`}
                >
                  {added ? "Добавлено ✓" : "Добавить в корзину"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
