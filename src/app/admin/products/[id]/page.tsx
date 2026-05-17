"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import ProductForm, { ProductFormData } from "@/components/admin/ProductForm";

interface Category {
  id: string;
  nameRu: string;
}

interface AnalyticsRecord {
  date: string;
  views: number;
  cartAdds: number;
}

function CssBarChart({
  data,
  valueKey,
  color,
}: {
  data: AnalyticsRecord[];
  valueKey: keyof AnalyticsRecord;
  color: string;
}) {
  if (!data.length) return <p className="text-xs" style={{ color: "#9a9a9a" }}>Нет данных</p>;
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const maxVal = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {data.map((d, i) => {
        const val = Number(d[valueKey] ?? 0);
        const h = (val / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center group relative" style={{ minWidth: 0 }}>
            <div className="absolute bottom-2 hidden group-hover:block bg-black text-white text-xs rounded px-1 py-0.5 whitespace-nowrap z-10">
              {String(d.date)}: {val}
            </div>
            <div
              className="w-full rounded-t"
              style={{ height: `${Math.max(h, 2)}%`, background: color }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getAuthHeaders } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [initial, setInitial] = useState<Partial<ProductFormData> | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      const headers = getAuthHeaders();
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products/${id}`, { headers }),
        fetch("/api/admin/categories", { headers }),
      ]);
      if (prodRes.ok) {
        const d = await prodRes.json();
        const p = d.product;
        // Convert specsRu/En objects to arrays
        const specsRuArr = Object.entries(p.specsRu ?? {}).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        const specsEnArr = Object.entries(p.specsEn ?? {}).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        // Colors from JSON
        const colorsArr = Array.isArray(p.colors)
          ? p.colors
          : Object.entries(p.colors ?? {}).map(([name, hex]) => ({ name, hex }));

        setInitial({
          nameRu: p.nameRu,
          nameEn: p.nameEn,
          descriptionRu: p.descriptionRu,
          descriptionEn: p.descriptionEn,
          sku: p.sku,
          categoryId: p.categoryId,
          price: String(p.price),
          discountPrice: p.discountPrice ? String(p.discountPrice) : "",
          images: p.images ?? [],
          sizes: p.sizes ?? [],
          colors: colorsArr,
          specsRu: specsRuArr,
          specsEn: specsEnArr,
          isNew: p.isNew,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
        });
        setAnalytics(p.analytics ?? []);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories ?? []);
      }
      setFetching(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(form: ProductFormData) {
    setLoading(true);
    const headers = getAuthHeaders();
    const specsRu = Object.fromEntries(form.specsRu.map((s) => [s.key, s.value]));
    const specsEn = Object.fromEntries(form.specsEn.map((s) => [s.key, s.value]));

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        specsRu,
        specsEn,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Ошибка сохранения");
    }
    router.push("/admin/products");
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "#9a9a9a" }}>Загрузка...</p>
      </div>
    );
  }

  const totalViews = analytics.reduce((s, a) => s + a.views, 0);
  const totalCartAdds = analytics.reduce((s, a) => s + a.cartAdds, 0);
  const conversion = totalViews > 0 ? ((totalCartAdds / totalViews) * 100).toFixed(1) : "0";

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: "#191E1B" }}>
        Редактировать товар
      </h1>
      <ProductForm
        initial={initial ?? undefined}
        categories={categories}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Сохранить изменения"
      >
        {/* Analytics section */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
            Аналитика (последние 30 дней)
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg p-3" style={{ background: "#F7F0EC" }}>
              <p className="text-2xl font-semibold" style={{ color: "#3F1111" }}>
                {totalViews.toLocaleString("ru-RU")}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>Просмотры</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "#F7F0EC" }}>
              <p className="text-2xl font-semibold" style={{ color: "#3F1111" }}>
                {totalCartAdds.toLocaleString("ru-RU")}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>В корзину</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "#F7F0EC" }}>
              <p className="text-2xl font-semibold" style={{ color: "#3F1111" }}>
                {conversion}%
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>Конверсия</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-2" style={{ color: "#9a9a9a" }}>Просмотры по дням</p>
              <CssBarChart data={analytics} valueKey="views" color="#3F1111" />
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: "#9a9a9a" }}>Добавления в корзину</p>
              <CssBarChart data={analytics} valueKey="cartAdds" color="#3b82f6" />
            </div>
          </div>
        </div>
      </ProductForm>
    </div>
  );
}
