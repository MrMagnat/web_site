"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { usePageView } from "@/hooks/usePageView";

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const t        = useTranslations("nav");
  const locale   = useLocale();
  const pathname = usePathname(); // полный путь включая /en префикс
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openCart, count } = useCartStore();
  const cartCount = count();

  const prefix = locale === "ru" ? "" : "/en";
  usePageView(); // трекинг визитов — срабатывает при каждом переходе

  // Строим URL той же страницы в другом языке
  // RU→EN: /catalog → /en/catalog
  // EN→RU: /en/catalog → /catalog
  const alternateLocaleUrl =
    locale === "ru"
      ? `/en${pathname}`
      : pathname.replace(/^\/en/, "") || "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLight = transparent && !scrolled;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 h-[72px] transition-all duration-400 ${
          isLight
            ? "border-b border-transparent"
            : "bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#e8e0da]"
        }`}
      >
        {/* Logo */}
        <Link
          href={`${prefix}/`}
          className={`font-prata text-[15px] sm:text-[17px] tracking-[0.1em] sm:tracking-[0.14em] uppercase whitespace-nowrap transition-colors duration-400 ${
            isLight ? "text-white" : "text-[#191E1B]"
          }`}
        >
          Андруа Фамиль
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-8 list-none">
          {(["catalog", "collections", "about", "delivery"] as const).map((key) => (
            <li key={key}>
              <Link
                href={
                  key === "catalog"     ? `${prefix}/catalog` :
                  key === "collections" ? `${prefix}/collections` :
                  key === "about"       ? `${prefix}/about` :
                  key === "delivery"    ? `${prefix}/return` :
                  `${prefix}/`
                }
                className={`text-[13px] tracking-[0.16em] uppercase transition-colors duration-300 link-animated ${
                  isLight ? "text-white/80 hover:text-white" : "text-[#9a9a9a] hover:text-[#191E1B]"
                }`}
              >
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Lang switcher */}
          <Link
            href={alternateLocaleUrl}
            className={`text-[10px] tracking-[0.18em] uppercase transition-colors duration-300 hidden md:block ${
              isLight ? "text-white/60 hover:text-white" : "text-[#9a9a9a] hover:text-[#191E1B]"
            }`}
          >
            {locale === "ru" ? "EN" : "RU"}
          </Link>

          {/* Search */}
          <Link
            href={`/${locale}/catalog`}
            className={`transition-colors duration-300 ${
              isLight ? "text-white/80 hover:text-white" : "text-[#9a9a9a] hover:text-[#191E1B]"
            }`}
            title={t("search")}
          >
            <Search size={18} strokeWidth={1.5} />
          </Link>

          {/* Account */}
          <Link
            href={`${prefix}/account`}
            className={`transition-colors duration-300 ${
              isLight ? "text-white/80 hover:text-white" : "text-[#9a9a9a] hover:text-[#191E1B]"
            }`}
            title="Личный кабинет"
          >
            <User size={18} strokeWidth={1.5} />
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            className={`relative transition-colors duration-300 ${
              isLight ? "text-white/80 hover:text-white" : "text-[#9a9a9a] hover:text-[#191E1B]"
            }`}
            title={t("cart")}
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-[18px] h-[18px] rounded-full bg-[#3F1111] text-white text-[9px] flex items-center justify-center font-medium">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu */}
          <button
            className={`md:hidden transition-colors ${
              isLight ? "text-white" : "text-[#191E1B]"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#191E1B] flex flex-col pt-[72px] px-6 pb-10">
          <ul className="flex flex-col gap-6 mt-10 list-none">
            {(["catalog", "collections", "about", "delivery"] as const).map((key) => (
              <li key={key}>
                <Link
                  href={
                    key === "catalog"     ? `${prefix}/catalog` :
                    key === "collections" ? `${prefix}/collections` :
                    key === "about"       ? `${prefix}/about` :
                    key === "delivery"    ? `${prefix}/return` :
                    `${prefix}/`
                  }
                  className="font-prata text-[22px] text-white/90 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <Link
              href={alternateLocaleUrl}
              className="text-[15px] tracking-[0.2em] uppercase text-white/40"
              onClick={() => setMobileOpen(false)}
            >
              {locale === "ru" ? "English" : "Русский"}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
