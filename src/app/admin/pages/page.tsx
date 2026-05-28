"use client";
import Link from "next/link";
import { FileText, Image } from "lucide-react";

const PAGES = [
  { slug: "delivery",        title: "Доставка и оплата" },
  { slug: "return-policy",   title: "Возврат товара" },
  { slug: "size-guide",      title: "Размерная сетка" },
  { slug: "care",            title: "Уход за изделиями" },
  { slug: "about",           title: "О бренде" },
  { slug: "company",         title: "О компании" },
  { slug: "values",          title: "Наши ценности" },
  { slug: "partnership",     title: "Партнёрство" },
];

export default function AdminPagesPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: "#191E1B" }}>
        Страницы сайта
      </h1>

      {/* Landing hero */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F7F0EC" }}>
            <Image size={16} style={{ color: "#3F1111" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#191E1B" }}>Лендинг — Главная страница</p>
            <p className="text-xs" style={{ color: "#9a9a9a" }}>Видео или фото на приветственном экране</p>
          </div>
        </div>
        <Link
          href="/admin/pages/landing"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#3F1111", color: "#FAFAFA" }}
        >
          Настроить
        </Link>
      </div>

      {/* Content pages */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F7F0EC" }}>
          <p className="text-sm font-semibold" style={{ color: "#191E1B" }}>Информационные страницы</p>
          <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>Редактируйте содержимое страниц через HTML-редактор</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#F7F0EC" }}>
          {PAGES.map((p) => (
            <div key={p.slug} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <FileText size={15} style={{ color: "#9a9a9a" }} />
                <div>
                  <p className="text-sm" style={{ color: "#191E1B" }}>{p.title}</p>
                  <p className="text-xs" style={{ color: "#9a9a9a" }}>/info/{p.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/info/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded border text-sm"
                  style={{ borderColor: "#e8e0da", color: "#9a9a9a" }}
                >
                  Открыть ↗
                </a>
                <Link
                  href={`/admin/pages/${p.slug}`}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: "#3F1111", color: "#FAFAFA" }}
                >
                  Редактировать
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
