"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import ProductForm, { ProductFormData } from "@/components/admin/ProductForm";

interface Category {
  id: string;
  nameRu: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const headers = getAuthHeaders();
      const res = await fetch("/api/admin/categories", { headers });
      if (res.ok) {
        const d = await res.json();
        setCategories(d.categories ?? []);
      }
    }
    loadCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(form: ProductFormData) {
    setLoading(true);
    const headers = getAuthHeaders();

    // Convert specsRu/En arrays to objects
    const specsRu = Object.fromEntries(form.specsRu.map((s) => [s.key, s.value]));
    const specsEn = Object.fromEntries(form.specsEn.map((s) => [s.key, s.value]));

    const res = await fetch("/api/admin/products", {
      method: "POST",
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
      throw new Error(d.error ?? "Ошибка создания товара");
    }
    router.push("/admin/products");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: "#191E1B" }}>
        Новый товар
      </h1>
      <ProductForm
        categories={categories}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Создать товар"
      />
    </div>
  );
}
