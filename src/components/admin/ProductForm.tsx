"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Plus, X, GripVertical, Wand2 } from "lucide-react";

interface ColorEntry {
  name: string;
  hex: string;
}

interface SpecEntry {
  key: string;
  value: string;
}

export interface ProductFormData {
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  sku: string;
  categoryId: string;
  price: string;
  discountPrice: string;
  images: string[];
  sizes: string[];
  colors: ColorEntry[];
  specsRu: SpecEntry[];
  specsEn: SpecEntry[];
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

interface Category {
  id: string;
  nameRu: string;
}

interface Props {
  initial?: Partial<ProductFormData>;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading: boolean;
  submitLabel?: string;
  children?: React.ReactNode;
}

function SpecsEditor({
  specs,
  onChange,
  label,
}: {
  specs: SpecEntry[];
  onChange: (s: SpecEntry[]) => void;
  label: string;
}) {
  function addSpec() {
    onChange([...specs, { key: "", value: "" }]);
  }
  function removeSpec(i: number) {
    onChange(specs.filter((_, idx) => idx !== i));
  }
  function updateSpec(i: number, field: "key" | "value", val: string) {
    onChange(specs.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium" style={{ color: "#191E1B" }}>
          {label}
        </label>
        <button
          type="button"
          onClick={addSpec}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded"
          style={{ background: "#F7F0EC", color: "#3F1111" }}
        >
          <Plus size={11} /> Добавить
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder="Параметр"
              value={s.key}
              onChange={(e) => updateSpec(i, "key", e.target.value)}
              className="flex-1 border rounded px-2 py-1.5 text-sm outline-none"
              style={{ borderColor: "#e8e0da" }}
            />
            <input
              type="text"
              placeholder="Значение"
              value={s.value}
              onChange={(e) => updateSpec(i, "value", e.target.value)}
              className="flex-1 border rounded px-2 py-1.5 text-sm outline-none"
              style={{ borderColor: "#e8e0da" }}
            />
            <button
              type="button"
              onClick={() => removeSpec(i)}
              className="p-1 rounded hover:bg-red-50"
            >
              <X size={14} style={{ color: "#ef4444" }} />
            </button>
          </div>
        ))}
        {!specs.length && (
          <p className="text-xs" style={{ color: "#9a9a9a" }}>
            Нет характеристик
          </p>
        )}
      </div>
    </div>
  );
}

function generateSku() {
  return "AF-" + Math.random().toString(36).toUpperCase().slice(2, 8);
}

export default function ProductForm({
  initial,
  categories,
  onSubmit,
  loading,
  submitLabel = "Сохранить",
  children,
}: Props) {
  const router = useRouter();
  const { getAuthHeaders } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormData>({
    nameRu: initial?.nameRu ?? "",
    nameEn: initial?.nameEn ?? "",
    descriptionRu: initial?.descriptionRu ?? "",
    descriptionEn: initial?.descriptionEn ?? "",
    sku: initial?.sku ?? generateSku(),
    categoryId: initial?.categoryId ?? "",
    price: initial?.price ?? "",
    discountPrice: initial?.discountPrice ?? "",
    images: initial?.images ?? [],
    sizes: initial?.sizes ?? [],
    colors: initial?.colors ?? [],
    specsRu: initial?.specsRu ?? [],
    specsEn: initial?.specsEn ?? [],
    isNew: initial?.isNew ?? false,
    isFeatured: initial?.isFeatured ?? false,
    isActive: initial?.isActive ?? true,
  });

  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState({ name: "", hex: "#000000" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ProductFormData>(key: K, val: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const headers = getAuthHeaders();
    // Remove Content-Type so browser sets multipart boundary
    const uploadHeaders: HeadersInit = { "x-admin-key": headers["x-admin-key" as keyof typeof headers] as string ?? "" };

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: uploadHeaders,
          body: fd,
        });
        if (res.ok) {
          const d = await res.json();
          uploaded.push(d.url);
        }
      }
      set("images", [...form.images, ...uploaded]);
    } catch {
      setError("Ошибка загрузки изображений");
    } finally {
      setUploading(false);
    }
  }

  function addSize() {
    const s = sizeInput.trim();
    if (!s || form.sizes.includes(s)) return;
    set("sizes", [...form.sizes, s]);
    setSizeInput("");
  }

  function addColor() {
    if (!colorInput.name.trim()) return;
    set("colors", [...form.colors, { ...colorInput }]);
    setColorInput({ name: "", hex: "#000000" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  }

  const inputCls =
    "w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
  const inputStyle = { borderColor: "#e8e0da", background: "#fff", color: "#191E1B" };
  const labelCls = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "#191E1B" };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Names */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
          Основное
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>
              Название (RU) *
            </label>
            <input
              required
              value={form.nameRu}
              onChange={(e) => set("nameRu", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>
              Название (EN)
            </label>
            <input
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls} style={labelStyle}>
              Описание (RU)
            </label>
            <textarea
              rows={3}
              value={form.descriptionRu}
              onChange={(e) => set("descriptionRu", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls} style={labelStyle}>
              Описание (EN)
            </label>
            <textarea
              rows={3}
              value={form.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* SKU, Category, Prices */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
          Цены и классификация
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>
              SKU *
            </label>
            <div className="flex gap-1">
              <input
                required
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => set("sku", generateSku())}
                className="p-2 border rounded-lg hover:bg-gray-50"
                style={{ borderColor: "#e8e0da" }}
                title="Сгенерировать"
              >
                <Wand2 size={14} style={{ color: "#9a9a9a" }} />
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>
              Категория *
            </label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputCls}
              style={inputStyle}
            >
              <option value="">Выберите...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameRu}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>
              Цена (₽) *
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>
              Цена со скидкой (₽)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
          Изображения
        </h2>
        <div
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#e8e0da" }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <p className="text-sm" style={{ color: "#9a9a9a" }}>
            {uploading
              ? "Загрузка..."
              : "Нажмите или перетащите изображения для загрузки"}
          </p>
        </div>
        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {form.images.map((img, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover border"
                  style={{ borderColor: "#e8e0da" }}
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "images",
                      form.images.filter((_, idx) => idx !== i)
                    )
                  }
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
                {i === 0 && (
                  <span
                    className="absolute bottom-1 left-1 text-[9px] px-1 rounded"
                    style={{ background: "#3F1111", color: "#fff" }}
                  >
                    Гл.
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sizes & Colors */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
          Размеры и цвета
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Sizes */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Размеры
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="50x80, L, XL..."
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                className={inputCls}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={addSize}
                className="px-3 border rounded-lg hover:bg-gray-50"
                style={{ borderColor: "#e8e0da" }}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.sizes.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "#F7F0EC", color: "#191E1B" }}
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => set("sizes", form.sizes.filter((_, idx) => idx !== i))}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Цвета
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Название цвета"
                value={colorInput.name}
                onChange={(e) =>
                  setColorInput((prev) => ({ ...prev, name: e.target.value }))
                }
                className={inputCls}
                style={inputStyle}
              />
              <input
                type="color"
                value={colorInput.hex}
                onChange={(e) =>
                  setColorInput((prev) => ({ ...prev, hex: e.target.value }))
                }
                className="w-10 h-10 border rounded-lg cursor-pointer"
                style={{ borderColor: "#e8e0da" }}
              />
              <button
                type="button"
                onClick={addColor}
                className="px-3 border rounded-lg hover:bg-gray-50"
                style={{ borderColor: "#e8e0da" }}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.colors.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "#F7F0EC", color: "#191E1B" }}
                >
                  <span
                    className="w-3 h-3 rounded-full border"
                    style={{ background: c.hex, borderColor: "#ccc" }}
                  />
                  {c.name}
                  <button
                    type="button"
                    onClick={() =>
                      set("colors", form.colors.filter((_, idx) => idx !== i))
                    }
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
          Характеристики
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <SpecsEditor
            specs={form.specsRu}
            onChange={(s) => set("specsRu", s)}
            label="Характеристики (RU)"
          />
          <SpecsEditor
            specs={form.specsEn}
            onChange={(s) => set("specsEn", s)}
            label="Характеристики (EN)"
          />
        </div>
      </div>

      {/* Flags */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
          Флаги
        </h2>
        <div className="flex gap-6">
          {(
            [
              { key: "isNew", label: "Новинка" },
              { key: "isFeatured", label: "Хит" },
              { key: "isActive", label: "Активен" },
            ] as { key: keyof ProductFormData; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 accent-red-900"
              />
              <span className="text-sm" style={{ color: "#191E1B" }}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Extra content (analytics) */}
      {children}

      {error && (
        <p className="text-sm text-center" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: "#3F1111", color: "#FAFAFA" }}
        >
          {loading ? "Сохранение..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg text-sm border"
          style={{ borderColor: "#e8e0da", color: "#191E1B" }}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
