"use client";

import { useEffect, useState, Fragment } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Copy, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";

interface UTMTag {
  id: string;
  name: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  baseUrl: string;
  generatedUrl: string;
  isActive: boolean;
  createdAt: string;
  _count?: { clicks: number };
}

interface ClickByDay {
  date: string;
  clicks: number;
}

const SOURCES = ["instagram", "telegram", "vk", "email", "other"];

function CssBarChart({ data }: { data: ClickByDay[] }) {
  if (!data.length)
    return <p className="text-xs" style={{ color: "#9a9a9a" }}>Нет кликов</p>;
  const max = Math.max(...data.map((d) => d.clicks), 1);
  return (
    <div className="flex items-end gap-0.5 h-16 w-full mt-2">
      {data.map((d, i) => {
        const h = (d.clicks / max) * 100;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center group relative"
            style={{ minWidth: 0 }}
          >
            <div
              className="absolute bottom-1 hidden group-hover:block bg-black text-white text-xs rounded px-1 py-0.5 whitespace-nowrap z-10"
            >
              {d.date}: {d.clicks}
            </div>
            <div
              className="w-full rounded-t"
              style={{ height: `${Math.max(h, 2)}%`, background: "#3F1111" }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function AdminUTMPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [tags, setTags] = useState<UTMTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clicksData, setClicksData] = useState<Record<string, ClickByDay[]>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    source: "instagram",
    medium: "",
    campaign: "",
    content: "",
    baseUrl: "https://andrua-famil.ru/",
  });

  async function load() {
    const headers = getAuthHeaders();
    const res = await fetch("/api/admin/utm", { headers });
    if (res.ok) {
      const d = await res.json();
      setTags(d.utmTags ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPreviewUrl() {
    try {
      const url = new URL(form.baseUrl || "https://andrua-famil.ru/");
      if (form.source) url.searchParams.set("utm_source", form.source);
      if (form.medium) url.searchParams.set("utm_medium", form.medium);
      if (form.campaign) url.searchParams.set("utm_campaign", form.campaign);
      if (form.content) url.searchParams.set("utm_content", form.content);
      return url.toString();
    } catch {
      return form.baseUrl;
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const headers = getAuthHeaders();
    const res = await fetch("/api/admin/utm", {
      method: "POST",
      headers,
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({
        name: "",
        source: "instagram",
        medium: "",
        campaign: "",
        content: "",
        baseUrl: "https://andrua-famil.ru/",
      });
      await load();
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить UTM-метку «${name}»?`)) return;
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/utm/${id}`, { method: "DELETE", headers });
    if (res.ok) setTags((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!clicksData[id]) {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/utm/${id}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setClicksData((prev) => ({
          ...prev,
          [id]: d.utmTag?.clicksPerDay ?? [],
        }));
      }
    }
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const previewUrl = getPreviewUrl();
  const inputCls = "border rounded-lg px-3 py-2 text-sm outline-none w-full";
  const inputStyle = { borderColor: "#e8e0da", background: "#fff", color: "#191E1B" };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: "#191E1B" }}>
        UTM-метки
      </h1>

      {/* Create form */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
          Создать UTM-метку
        </h2>
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Название *
              </label>
              <input
                required
                type="text"
                placeholder="Instagram Stories апрель"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Source *
              </label>
              <select
                required
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Medium
              </label>
              <input
                type="text"
                placeholder="story, post, cpc..."
                value={form.medium}
                onChange={(e) => setForm((f) => ({ ...f, medium: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Campaign
              </label>
              <input
                type="text"
                placeholder="spring_sale"
                value={form.campaign}
                onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Content (необязательно)
              </label>
              <input
                type="text"
                placeholder="banner_top"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#191E1B" }}>
                Ссылка назначения
              </label>
              <input
                type="url"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className="rounded-lg p-3 mb-3 flex items-center justify-between gap-2"
            style={{ background: "#F7F0EC" }}
          >
            <p className="text-xs font-mono break-all flex-1" style={{ color: "#3F1111" }}>
              {previewUrl}
            </p>
            <button
              type="button"
              onClick={() => copyUrl(previewUrl, "preview")}
              className="shrink-0 p-1.5 rounded hover:bg-white transition-colors"
            >
              {copied === "preview" ? (
                <Check size={14} style={{ color: "#10b981" }} />
              ) : (
                <Copy size={14} style={{ color: "#9a9a9a" }} />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#3F1111", color: "#FAFAFA" }}
          >
            Создать
          </button>
        </form>
      </div>

      {/* Tags table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <div className="px-5 py-3 border-b" style={{ borderColor: "#F7F0EC" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#191E1B" }}>
            Все UTM-метки ({tags.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#9a9a9a" }}>
            Загрузка...
          </div>
        ) : (
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr style={{ background: "#F7F0EC" }}>
                {["Название", "Source", "Campaign", "Клики", "Создан", "Действия"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium"
                      style={{ color: "#9a9a9a" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {tags.map((tag, i) => {
                const expanded = expandedId === tag.id;
                return (
                  <Fragment key={tag.id}>
                    <tr
                      className="border-t cursor-pointer hover:bg-amber-50 transition-colors"
                      style={{
                        borderColor: "#F7F0EC",
                        background: expanded ? "#FFF8F5" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}
                      onClick={() => handleExpand(tag.id)}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "#191E1B" }}>
                        {tag.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9a9a9a" }}>
                        {tag.source}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9a9a9a" }}>
                        {tag.campaign || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#191E1B" }}>
                        {tag._count?.clicks ?? 0}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9a9a9a" }}>
                        {new Date(tag.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => copyUrl(tag.generatedUrl, tag.id)}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Копировать URL"
                          >
                            {copied === tag.id ? (
                              <Check size={14} style={{ color: "#10b981" }} />
                            ) : (
                              <Copy size={14} style={{ color: "#9a9a9a" }} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Удалить"
                          >
                            <Trash2 size={14} style={{ color: "#ef4444" }} />
                          </button>
                          {expanded ? (
                            <ChevronUp size={14} style={{ color: "#9a9a9a" }} />
                          ) : (
                            <ChevronDown size={14} style={{ color: "#9a9a9a" }} />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr
                        key={`${tag.id}-detail`}
                        style={{ background: "#FFF8F5" }}
                        className="border-t"
                      >
                        <td colSpan={6} className="px-8 py-4">
                          <div className="flex gap-8">
                            <div className="flex-1">
                              <p
                                className="text-xs font-semibold mb-1"
                                style={{ color: "#9a9a9a" }}
                              >
                                Сгенерированный URL
                              </p>
                              <p
                                className="text-xs font-mono break-all"
                                style={{ color: "#3F1111" }}
                              >
                                {tag.generatedUrl}
                              </p>
                            </div>
                            <div className="w-80">
                              <p
                                className="text-xs font-semibold mb-1"
                                style={{ color: "#9a9a9a" }}
                              >
                                Клики по дням (30 дней)
                              </p>
                              <CssBarChart data={clicksData[tag.id] ?? []} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!tags.length && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center" style={{ color: "#9a9a9a" }}>
                    Нет UTM-меток
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
