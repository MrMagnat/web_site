"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Plus, Search, Eye, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  nameRu: string;
  images: string[];
  categoryId: string;
  categoryName: string;
  price: number;
  discountPrice?: number;
  totalViews: number;
  totalCartAdds: number;
  isActive: boolean;
}

export default function AdminProductsPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<{ id: string; nameRu: string }[]>([]);

  async function load() {
    const headers = getAuthHeaders();
    const [prodRes, catRes] = await Promise.all([
      fetch("/api/admin/products", { headers }),
      fetch("/api/admin/categories", { headers }),
    ]);
    if (prodRes.ok) {
      const d = await prodRes.json();
      setProducts(d.products ?? []);
    }
    if (catRes.ok) {
      const d = await catRes.json();
      setCategories(d.categories ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleActive(id: string, current: boolean) {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
      );
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить товар «${name}»?`)) return;
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.nameRu.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      categoryFilter === "all" || p.categoryId === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const fmtPrice = (n: number) =>
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>
          Товары
        </h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#3F1111", color: "#FAFAFA" }}
        >
          <Plus size={16} />
          Добавить товар
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div
          className="flex items-center gap-2 flex-1 border rounded-lg px-3 py-2"
          style={{ borderColor: "#e8e0da", background: "#fff" }}
        >
          <Search size={15} style={{ color: "#9a9a9a" }} />
          <input
            type="text"
            placeholder="Поиск по названию или SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm"
            style={{ color: "#191E1B" }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none"
          style={{ borderColor: "#e8e0da", background: "#fff", color: "#191E1B" }}
        >
          <option value="all">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameRu}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#9a9a9a" }}>
            Загрузка...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F0EC" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Фото
                </th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Название / SKU
                </th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Категория
                </th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Цена
                </th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  <Eye size={13} className="inline mr-1" />
                </th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Корзина
                </th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Статус
                </th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-amber-50 transition-colors"
                  style={{ borderColor: "#F7F0EC", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                >
                  <td className="px-4 py-3">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.nameRu}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-xs"
                        style={{ background: "#F7F0EC", color: "#9a9a9a" }}
                      >
                        нет
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "#191E1B" }}>
                      {p.nameRu}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>
                      {p.sku}
                    </p>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#191E1B" }}>
                    {p.categoryName}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p style={{ color: "#191E1B" }}>{fmtPrice(p.price)}</p>
                    {p.discountPrice && (
                      <p className="text-xs" style={{ color: "#3F1111" }}>
                        {fmtPrice(p.discountPrice)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "#191E1B" }}>
                    {p.totalViews ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "#191E1B" }}>
                    {p.totalCartAdds ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: p.isActive ? "#d1fae520" : "#fee2e220",
                        color: p.isActive ? "#059669" : "#ef4444",
                      }}
                    >
                      {p.isActive ? "Активен" : "Скрыт"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Редактировать"
                      >
                        <Pencil size={14} style={{ color: "#9a9a9a" }} />
                      </Link>
                      <button
                        onClick={() => handleToggleActive(p.id, p.isActive)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title={p.isActive ? "Скрыть" : "Активировать"}
                      >
                        {p.isActive ? (
                          <ToggleRight size={14} style={{ color: "#059669" }} />
                        ) : (
                          <ToggleLeft size={14} style={{ color: "#9a9a9a" }} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.nameRu)}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={14} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center" style={{ color: "#9a9a9a" }}>
                    Товары не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
