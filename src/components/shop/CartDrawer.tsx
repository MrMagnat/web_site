"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, Tag } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    removeItem,
    updateQty,
    promoCode,
    discount,
    applyPromo,
    removePromo,
    subtotal,
    total,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        applyPromo(promoInput.trim().toUpperCase(), data.discountPercent);
        setPromoInput("");
      } else {
        setPromoError(data.message ?? data.error ?? "Промокод не найден");
      }
    } catch {
      setPromoError("Ошибка проверки промокода");
    } finally {
      setPromoLoading(false);
    }
  };

  const sub = subtotal();
  const tot = total();
  const discountAmount = sub - tot;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-400 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-[420px] bg-[#FAFAFA] shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e0da]">
          <h2 className="font-prata text-[18px] tracking-wide text-[#191E1B]">
            Корзина
          </h2>
          <div className="flex items-center gap-4">
            {items.length > 0 && (
              <span className="text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a]">
                {items.reduce((s, i) => s + i.qty, 0)} шт.
              </span>
            )}
            <button
              onClick={closeCart}
              className="text-[#9a9a9a] hover:text-[#191E1B] transition-colors"
              aria-label="Закрыть"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F7F0EC] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p className="font-prata text-[16px] text-[#191E1B]">Корзина пуста</p>
              <p className="text-[13px] text-[#9a9a9a] leading-relaxed">
                Добавьте товары из каталога
              </p>
              <button
                onClick={closeCart}
                className="mt-2 text-[11px] tracking-[0.16em] uppercase text-[#3F1111] border-b border-[#3F1111] pb-0.5 hover:opacity-70 transition-opacity"
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {/* Image */}
                <div className="w-20 h-24 flex-shrink-0 bg-[#F7F0EC] overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F7F0EC]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-prata text-[14px] leading-snug text-[#191E1B] line-clamp-2 mb-1">
                    {item.name}
                  </p>
                  {(item.size || item.color) && (
                    <p className="text-[11px] text-[#9a9a9a] mb-2">
                      {[item.size && `Размер: ${item.size}`, item.color && `Цвет: ${item.color}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="text-[13px] font-medium text-[#191E1B] mb-3">
                    {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#e8e0da]">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#9a9a9a] hover:text-[#191E1B] transition-colors"
                        aria-label="Уменьшить"
                      >
                        <Minus size={12} strokeWidth={1.5} />
                      </button>
                      <span className="w-7 text-center text-[13px] select-none">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#9a9a9a] hover:text-[#191E1B] transition-colors"
                        aria-label="Увеличить"
                      >
                        <Plus size={12} strokeWidth={1.5} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#9a9a9a] hover:text-[#3F1111] transition-colors"
                      aria-label="Удалить"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer (only if items exist) */}
        {items.length > 0 && (
          <div className="border-t border-[#e8e0da] px-6 pt-4 pb-6 space-y-4">
            {/* Promo */}
            {promoCode ? (
              <div className="flex items-center justify-between bg-[#F7F0EC] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[12px] text-[#3F1111]">
                  <Tag size={13} strokeWidth={1.5} />
                  <span className="font-medium">{promoCode}</span>
                  <span className="text-[#9a9a9a]">−{discount}%</span>
                </div>
                <button
                  onClick={removePromo}
                  className="text-[#9a9a9a] hover:text-[#3F1111] transition-colors"
                  aria-label="Убрать промокод"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    placeholder="Промокод"
                    className="flex-1 border border-[#e8e0da] px-3 py-2 text-[12px] tracking-[0.08em] uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9a9a9a] bg-transparent outline-none focus:border-[#3F1111] transition-colors"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 py-2 bg-[#191E1B] text-white text-[11px] tracking-[0.14em] uppercase hover:bg-[#3F1111] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {promoLoading ? "…" : "Применить"}
                  </button>
                </div>
                {promoError && (
                  <p className="text-[11px] text-[#3F1111]">{promoError}</p>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between text-[#9a9a9a]">
                <span>Сумма</span>
                <span>{sub.toLocaleString("ru-RU")} ₽</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#3F1111]">
                  <span>Скидка ({discount}%)</span>
                  <span>−{discountAmount.toLocaleString("ru-RU")} ₽</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-[15px] text-[#191E1B] pt-2 border-t border-[#e8e0da]">
                <span>Итого</span>
                <span>{tot.toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/cart"
              onClick={closeCart}
              className="block w-full bg-[#3F1111] text-white text-center text-[12px] tracking-[0.18em] uppercase py-3.5 hover:bg-[#5a1a1a] transition-colors"
            >
              Оформить заказ
            </Link>
            <button
              onClick={closeCart}
              className="block w-full text-center text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] hover:text-[#191E1B] transition-colors py-1"
            >
              Продолжить покупки
            </button>
          </div>
        )}
      </div>
    </>
  );
}
