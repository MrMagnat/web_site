"use client";
import { useEffect, useState, use } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ArrowLeft, Check, Eye } from "lucide-react";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  delivery:      "Доставка и оплата",
  "return-policy": "Возврат товара",
  "size-guide":  "Размерная сетка",
  care:          "Уход за изделиями",
  about:         "О бренде",
  company:       "О компании",
  values:        "Наши ценности",
  partnership:   "Партнёрство",
  contacts:      "Контакты",
};

export default function PageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { getAuthHeaders } = useAdminAuth();

  const [titleRu, setTitleRu] = useState(PAGE_TITLES[slug] ?? "");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/pages`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const page = (data.pages ?? []).find((p: { slug: string }) => p.slug === slug);
        if (page) {
          setTitleRu(page.titleRu || PAGE_TITLES[slug] || "");
          setContent(page.content || "");
        }
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ slug, titleRu, content }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  const inputCls = "border rounded-lg px-3 py-2 text-sm outline-none w-full";
  const inputStyle = { borderColor: "#e8e0da", background: "#fff", color: "#191E1B" };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/pages" className="p-1.5 rounded hover:bg-gray-100">
            <ArrowLeft size={18} style={{ color: "#9a9a9a" }} />
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>
            {PAGE_TITLES[slug] ?? slug}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/info/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#e8e0da", color: "#9a9a9a" }}
          >
            <Eye size={14} /> Просмотр
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            style={{ background: "#3F1111", color: "#FAFAFA" }}
          >
            {saved ? <><Check size={14} /> Сохранено</> : saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Title */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <label className="block text-xs font-medium mb-2" style={{ color: "#191E1B" }}>
            Заголовок страницы
          </label>
          <input
            type="text"
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        {/* HTML editor — код и живое превью видны одновременно */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Код */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <label className="block text-xs font-medium mb-3" style={{ color: "#191E1B" }}>
              HTML-код
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={22}
              className="w-full rounded border px-3 py-2.5 text-sm font-mono outline-none resize-y"
              style={{ borderColor: "#e8e0da", background: "#fff", color: "#191E1B", lineHeight: 1.6 }}
              placeholder={`<h2>Заголовок раздела</h2>\n<p>Текст параграфа...</p>\n<table>\n  <tr><th>Размер</th><th>Ширина</th></tr>\n  <tr><td>S</td><td>40 см</td></tr>\n</table>`}
            />
            <p className="mt-2 text-[11px]" style={{ color: "#9a9a9a" }}>
              Поддерживается HTML: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;table&gt;, &lt;strong&gt;, &lt;a&gt;
            </p>
          </div>

          {/* Живое превью */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <label className="block text-xs font-medium mb-3" style={{ color: "#191E1B" }}>
              Превью (как увидит покупатель)
            </label>
            <div
              className="prose-custom min-h-[400px] p-4 rounded border text-sm overflow-x-auto"
              style={{ borderColor: "#e8e0da", background: "#FAFAFA" }}
              dangerouslySetInnerHTML={{ __html: content || "<p style='color:#9a9a9a'>Здесь появится превью по мере набора HTML…</p>" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
