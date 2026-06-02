"use client";

import { useEffect, useState, useRef } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Plus, X, ChevronUp, ChevronDown, Pencil, Check, Trash2, Upload } from "lucide-react";

interface Category {
  id: string;
  slug: string;
  nameRu: string;
  nameEn: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AdminCategoriesPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Category>>({});
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat] = useState({
    nameRu: "",
    nameEn: "",
    slug: "",
    image: "",
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const newFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const headers = getAuthHeaders();
    const res = await fetch("/api/admin/categories", { headers });
    if (res.ok) {
      const d = await res.json();
      setCategories(d.categories ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    const headers = getAuthHeaders();
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload/categories", {
        method: "POST",
        headers: { "x-admin-key": (headers as Record<string, string>)["x-admin-key"] ?? "" },
        body: fd,
      });
      if (res.ok) {
        const d = await res.json();
        return d.url as string;
      }
    } catch {/* ignore */} finally {
      setUploading(false);
    }
    return null;
  }

  async function handleNewImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setNewCat((prev) => ({ ...prev, image: url }));
  }

  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setEditData((prev) => ({ ...prev, image: url }));
  }

  async function handleCreate() {
    if (!newCat.nameRu) return;
    setSaving(true);
    const headers = getAuthHeaders();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...newCat,
        slug: newCat.slug || slugify(newCat.nameRu),
        sortOrder: categories.length,
      }),
    });
    if (res.ok) {
      setNewCat({ nameRu: "", nameEn: "", slug: "", image: "", sortOrder: 0 });
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    const headers = getAuthHeaders();
    await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(editData),
    });
    setEditId(null);
    await load();
    setSaving(false);
  }

  async function handleMove(id: string, dir: "up" | "down") {
    const idx = categories.findIndex((c) => c.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === categories.length - 1) return;

    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const headers = getAuthHeaders();

    await Promise.all([
      fetch(`/api/admin/categories/${categories[idx].id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ sortOrder: categories[swapIdx].sortOrder }),
      }),
      fetch(`/api/admin/categories/${categories[swapIdx].id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ sortOrder: categories[idx].sortOrder }),
      }),
    ]);
    await load();
  }

  async function handleToggle(id: string, isActive: boolean) {
    const headers = getAuthHeaders();
    await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ isActive: !isActive }),
    });
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c))
    );
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить категорию «${name}»? Это действие нельзя отменить.`)) return;
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Не удалось удалить категорию");
    }
  }

  const inputCls = "border rounded-lg px-3 py-2 text-sm outline-none";
  const inputStyle = { borderColor: "#e8e0da", background: "#fff", color: "#191E1B" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>
          Категории
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#3F1111", color: "#FAFAFA" }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Отмена" : "Добавить категорию"}
        </button>
      </div>

      {/* New category form */}
      {showForm && (
        <div
          className="bg-white rounded-xl p-5 shadow-sm mb-6"
          style={{ border: "1px solid #e8e0da" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
            Новая категория
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Название (RU) *
              </label>
              <input
                type="text"
                value={newCat.nameRu}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewCat((prev) => ({
                    ...prev,
                    nameRu: v,
                    slug: prev.slug || slugify(v),
                  }));
                }}
                className={`w-full ${inputCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Название (EN)
              </label>
              <input
                type="text"
                value={newCat.nameEn}
                onChange={(e) =>
                  setNewCat((prev) => ({ ...prev, nameEn: e.target.value }))
                }
                className={`w-full ${inputCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Slug
              </label>
              <input
                type="text"
                value={newCat.slug}
                onChange={(e) =>
                  setNewCat((prev) => ({ ...prev, slug: e.target.value }))
                }
                className={`w-full ${inputCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Изображение
              </label>
              <input
                ref={newFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleNewImageUpload}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => newFileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
                  style={{ borderColor: "#e8e0da", color: "#3F1111" }}
                >
                  <Upload size={14} />
                  {uploading ? "Загрузка..." : "Выбрать файл"}
                </button>
                {newCat.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newCat.image} alt="" className="w-10 h-10 rounded object-cover border" style={{ borderColor: "#e8e0da" }} />
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving || !newCat.nameRu}
              className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: "#3F1111", color: "#FAFAFA" }}
            >
              {saving ? "Сохранение..." : "Создать"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#9a9a9a" }}>
            Загрузка...
          </div>
        ) : (
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr style={{ background: "#F7F0EC" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Изображение
                </th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Название
                </th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Slug
                </th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Товаров
                </th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "#9a9a9a" }}>
                  Порядок
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
              {categories.map((cat, i) => {
                const isEditing = editId === cat.id;
                return (
                  <tr
                    key={cat.id}
                    className="border-t"
                    style={{
                      borderColor: "#F7F0EC",
                      background: i % 2 === 0 ? "#fff" : "#FAFAFA",
                    }}
                  >
                    <td className="px-4 py-3">
                      <input
                        ref={isEditing ? editFileRef : undefined}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditImageUpload}
                      />
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => editFileRef.current?.click()}
                          disabled={uploading}
                          className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-lg border-2 border-dashed text-xs"
                          style={{ borderColor: "#e8e0da", color: "#9a9a9a" }}
                          title="Загрузить изображение"
                        >
                          {(editData.image ?? cat.image) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={editData.image ?? cat.image}
                              alt=""
                              className="w-full h-full rounded-lg object-cover"
                            />
                          ) : (
                            <>
                              <Upload size={14} />
                              {uploading ? "…" : "фото"}
                            </>
                          )}
                        </button>
                      ) : cat.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cat.image}
                          alt={cat.nameRu}
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
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            value={editData.nameRu ?? cat.nameRu}
                            onChange={(e) =>
                              setEditData((d) => ({ ...d, nameRu: e.target.value }))
                            }
                            className="border rounded px-2 py-1 text-sm outline-none w-full"
                            style={{ borderColor: "#e8e0da" }}
                            placeholder="RU"
                          />
                          <input
                            value={editData.nameEn ?? cat.nameEn}
                            onChange={(e) =>
                              setEditData((d) => ({ ...d, nameEn: e.target.value }))
                            }
                            className="border rounded px-2 py-1 text-sm outline-none w-full"
                            style={{ borderColor: "#e8e0da" }}
                            placeholder="EN"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium" style={{ color: "#191E1B" }}>
                            {cat.nameRu}
                          </p>
                          <p className="text-xs" style={{ color: "#9a9a9a" }}>
                            {cat.nameEn}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editData.slug ?? cat.slug}
                          onChange={(e) =>
                            setEditData((d) => ({ ...d, slug: e.target.value }))
                          }
                          className="border rounded px-2 py-1 text-sm outline-none"
                          style={{ borderColor: "#e8e0da" }}
                        />
                      ) : (
                        <code className="text-xs" style={{ color: "#9a9a9a" }}>
                          {cat.slug}
                        </code>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: "#191E1B" }}>
                      {cat._count?.products ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: "#9a9a9a" }}>
                      {cat.sortOrder}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(cat.id, cat.isActive)}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: cat.isActive ? "#d1fae520" : "#fee2e220",
                          color: cat.isActive ? "#059669" : "#ef4444",
                        }}
                      >
                        {cat.isActive ? "Активна" : "Скрыта"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleMove(cat.id, "up")}
                          className="p-1 rounded hover:bg-gray-100"
                          disabled={i === 0}
                        >
                          <ChevronUp size={14} style={{ color: "#9a9a9a" }} />
                        </button>
                        <button
                          onClick={() => handleMove(cat.id, "down")}
                          className="p-1 rounded hover:bg-gray-100"
                          disabled={i === categories.length - 1}
                        >
                          <ChevronDown size={14} style={{ color: "#9a9a9a" }} />
                        </button>
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1 rounded hover:bg-green-50"
                          >
                            <Check size={14} style={{ color: "#059669" }} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditId(cat.id);
                              setEditData({});
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Pencil size={14} style={{ color: "#9a9a9a" }} />
                          </button>
                        )}
                        {isEditing && (
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <X size={14} style={{ color: "#9a9a9a" }} />
                          </button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={() => handleDelete(cat.id, cat.nameRu)}
                            className="p-1 rounded hover:bg-red-50"
                            title="Удалить категорию"
                          >
                            <Trash2 size={14} style={{ color: "#ef4444" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!categories.length && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center" style={{ color: "#9a9a9a" }}>
                    Нет категорий
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
