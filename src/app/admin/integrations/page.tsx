"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ChevronDown, ChevronUp, Plus, Trash2, ToggleLeft, ToggleRight, Check, Info, PackagePlus } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses?: number;
  usedCount: number;
  appliedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface IntegrationSection {
  id: string;
  title: string;
  expanded: boolean;
}

export default function AdminIntegrationsPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [sections, setSections] = useState<IntegrationSection[]>([
    { id: "yookassa", title: "ЮKassa (оплата)", expanded: true },
    { id: "ozon", title: "Ozon Логистика", expanded: false },
    { id: "promo", title: "Промокоды", expanded: false },
  ]);

  // ЮKassa
  const [kassaShopId, setKassaShopId] = useState("");
  const [kassaSecret, setKassaSecret] = useState("");
  const [kassaFiscal, setKassaFiscal] = useState(false);
  const [kassaVat, setKassaVat] = useState("1");
  const [kassaSaving, setKassaSaving] = useState(false);
  const [kassaMsg, setKassaMsg] = useState("");

  // Ozon
  const [ozonClientId, setOzonClientId] = useState("");
  const [ozonApiKey, setOzonApiKey] = useState("");
  const [ozonSaving, setOzonSaving] = useState(false);
  const [ozonMsg, setOzonMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported?: number; skipped?: number; message?: string; error?: string } | null>(null);

  // Promos
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    discountPercent: "",
    maxUses: "",
    expiresAt: "",
  });
  const [promoSaving, setPromoSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const headers = getAuthHeaders();
      const res = await fetch("/api/admin/integrations", { headers });
      if (res.ok) {
        const d = await res.json();
        const intg = d.integrations ?? {};
        if (intg.ozon_client_id) setOzonClientId(intg.ozon_client_id);
        if (intg.yookassa_shop_id) setKassaShopId(intg.yookassa_shop_id);
        if (intg.yookassa_fiscalization) setKassaFiscal(intg.yookassa_fiscalization === "1");
        if (intg.yookassa_vat_code) setKassaVat(intg.yookassa_vat_code);
        // секретный ключ приходит замаскированным — показываем плейсхолдер, не значение
        if (intg.yookassa_secret_key) setKassaSecret("");
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPromos() {
    setPromosLoading(true);
    const headers = getAuthHeaders();
    const res = await fetch("/api/admin/promo", { headers });
    if (res.ok) {
      const d = await res.json();
      setPromos(d.promoCodes ?? []);
    }
    setPromosLoading(false);
  }

  function toggleSection(id: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s))
    );
    if (id === "promo" && sections.find((s) => s.id === "promo" && !s.expanded)) {
      loadPromos();
    }
  }

  async function saveKassa() {
    setKassaSaving(true);
    const headers = getAuthHeaders();
    const reqs: Promise<Response>[] = [];
    const post = (key: string, value: string) =>
      reqs.push(
        fetch("/api/admin/integrations", {
          method: "POST",
          headers,
          body: JSON.stringify({ key, value }),
        })
      );

    if (kassaShopId) post("yookassa_shop_id", kassaShopId);
    // секрет отправляем ТОЛЬКО если ввели новый (пустое поле = не менять)
    if (kassaSecret) post("yookassa_secret_key", kassaSecret);
    post("yookassa_fiscalization", kassaFiscal ? "1" : "0");
    post("yookassa_vat_code", kassaVat);

    await Promise.all(reqs);
    setKassaSecret(""); // не держим секрет в памяти формы
    setKassaMsg("Сохранено");
    setTimeout(() => setKassaMsg(""), 3000);
    setKassaSaving(false);
  }

  async function saveOzon() {
    setOzonSaving(true);
    const headers = getAuthHeaders();
    await Promise.all([
      ozonClientId &&
        fetch("/api/admin/integrations", {
          method: "POST",
          headers,
          body: JSON.stringify({ key: "ozon_client_id", value: ozonClientId }),
        }),
      ozonApiKey &&
        fetch("/api/admin/integrations", {
          method: "POST",
          headers,
          body: JSON.stringify({ key: "ozon_api_key", value: ozonApiKey }),
        }),
    ].filter(Boolean));
    setOzonMsg("Сохранено");
    setTimeout(() => setOzonMsg(""), 3000);
    setOzonSaving(false);
  }

  async function handleImportFromOzon() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/ozon/import-products", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult({ imported: data.imported, skipped: data.skipped, message: data.message });
      } else {
        setImportResult({ error: data.error ?? "Ошибка импорта" });
      }
    } catch {
      setImportResult({ error: "Ошибка соединения" });
    } finally {
      setImporting(false);
    }
  }

  async function handleCreatePromo(e: React.FormEvent) {
    e.preventDefault();
    setPromoSaving(true);
    const headers = getAuthHeaders();
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers,
      body: JSON.stringify({
        code: newPromo.code,
        discountPercent: Number(newPromo.discountPercent),
        maxUses: newPromo.maxUses ? Number(newPromo.maxUses) : undefined,
        expiresAt: newPromo.expiresAt || undefined,
      }),
    });
    if (res.ok) {
      setNewPromo({ code: "", discountPercent: "", maxUses: "", expiresAt: "" });
      await loadPromos();
    }
    setPromoSaving(false);
  }

  async function handleTogglePromo(id: string, isActive: boolean) {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/promo/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      setPromos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p))
      );
    }
  }

  async function handleDeletePromo(id: string, code: string) {
    if (!confirm(`Удалить промокод «${code}»?`)) return;
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/promo/${id}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) setPromos((prev) => prev.filter((p) => p.id !== id));
  }

  const inputCls = "border rounded-lg px-3 py-2 text-sm outline-none w-full";
  const inputStyle = { borderColor: "#e8e0da", background: "#fff", color: "#191E1B" };
  const labelStyle = "block text-xs font-medium mb-1.5";

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: "#191E1B" }}>
        Интеграции
      </h1>

      <div className="flex flex-col gap-4">

        {/* ── ЮKassa ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => toggleSection("yookassa")}
          >
            <span className="text-sm font-semibold" style={{ color: "#191E1B" }}>
              ЮKassa — приём оплаты
            </span>
            {sections.find((s) => s.id === "yookassa")?.expanded ? (
              <ChevronUp size={16} style={{ color: "#9a9a9a" }} />
            ) : (
              <ChevronDown size={16} style={{ color: "#9a9a9a" }} />
            )}
          </button>
          {sections.find((s) => s.id === "yookassa")?.expanded && (
            <div className="px-5 pb-5 border-t" style={{ borderColor: "#F7F0EC" }}>

              {/* Info */}
              <div
                className="mt-4 mb-5 px-4 py-3 rounded-lg flex gap-3"
                style={{ background: "#F7F0EC", borderLeft: "3px solid #3F1111" }}
              >
                <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#3F1111" }} />
                <div className="text-[12px] leading-relaxed" style={{ color: "#9a9a9a" }}>
                  <p className="font-medium mb-0.5" style={{ color: "#191E1B" }}>
                    Ключи из личного кабинета ЮKassa
                  </p>
                  <p>
                    <a href="https://yookassa.ru/my" target="_blank" rel="noopener noreferrer"
                      className="underline" style={{ color: "#3F1111" }}>
                      yookassa.ru/my
                    </a>{" "}
                    → Интеграция → Ключи API. Секретный ключ хранится в БД в
                    зашифрованном виде и не показывается обратно.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle} style={{ color: "#191E1B" }}>shopId (идентификатор магазина)</label>
                  <input type="text" value={kassaShopId}
                    onChange={(e) => setKassaShopId(e.target.value)}
                    placeholder="123456" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle} style={{ color: "#191E1B" }}>Секретный ключ</label>
                  <input type="password" value={kassaSecret}
                    onChange={(e) => setKassaSecret(e.target.value)}
                    placeholder="Оставьте пустым, чтобы не менять" className={inputCls} style={inputStyle} />
                </div>
              </div>

              {/* Фискализация */}
              <div className="mt-4 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setKassaFiscal((v) => !v)}
                  className="mt-0.5"
                  aria-label="Фискализация"
                >
                  {kassaFiscal
                    ? <ToggleRight size={26} style={{ color: "#059669" }} />
                    : <ToggleLeft size={26} style={{ color: "#9a9a9a" }} />}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#191E1B" }}>
                    Отправлять чек 54-ФЗ
                  </p>
                  <p className="text-[12px]" style={{ color: "#9a9a9a" }}>
                    Включайте, только если фискализация подключена в ЮKassa. Иначе оплата вернёт ошибку.
                  </p>
                </div>
                {kassaFiscal && (
                  <div>
                    <label className={labelStyle} style={{ color: "#191E1B" }}>Ставка НДС</label>
                    <select value={kassaVat} onChange={(e) => setKassaVat(e.target.value)}
                      className={inputCls} style={inputStyle}>
                      <option value="1">Без НДС (УСН)</option>
                      <option value="2">0%</option>
                      <option value="3">10%</option>
                      <option value="4">20%</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Webhook URL */}
              <div className="mt-4 px-4 py-3 rounded-lg text-[12px]" style={{ background: "#F7F0EC", color: "#9a9a9a" }}>
                <p className="font-medium mb-1" style={{ color: "#191E1B" }}>URL для уведомлений (webhook)</p>
                <p>В кабинете ЮKassa → HTTP-уведомления укажите:</p>
                <code className="block mt-1 px-2 py-1 rounded text-[11px] break-all" style={{ background: "#fff", color: "#3F1111" }}>
                  https://andruafamil.ru/api/webhooks/yookassa
                </code>
                <p className="mt-1">События: <b>payment.succeeded</b>, <b>payment.canceled</b>.</p>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button onClick={saveKassa} disabled={kassaSaving}
                  className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                  style={{ background: "#3F1111", color: "#FAFAFA" }}>
                  {kassaSaving ? "Сохранение..." : "Сохранить"}
                </button>
                {kassaMsg && (
                  <span className="text-sm flex items-center gap-1" style={{ color: "#10b981" }}>
                    <Check size={14} /> {kassaMsg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Ozon ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => toggleSection("ozon")}
          >
            <span className="text-sm font-semibold" style={{ color: "#191E1B" }}>
              Ozon Логистика
            </span>
            {sections.find((s) => s.id === "ozon")?.expanded ? (
              <ChevronUp size={16} style={{ color: "#9a9a9a" }} />
            ) : (
              <ChevronDown size={16} style={{ color: "#9a9a9a" }} />
            )}
          </button>
          {sections.find((s) => s.id === "ozon")?.expanded && (
            <div className="px-5 pb-5 border-t" style={{ borderColor: "#F7F0EC" }}>

              {/* Info */}
              <div
                className="mt-4 mb-5 px-4 py-3 rounded-lg flex gap-3"
                style={{ background: "#F7F0EC", borderLeft: "3px solid #3F1111" }}
              >
                <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#3F1111" }} />
                <div className="text-[12px] leading-relaxed" style={{ color: "#9a9a9a" }}>
                  <p className="font-medium mb-0.5" style={{ color: "#191E1B" }}>
                    Ключи Ozon Seller API
                  </p>
                  <p>
                    Найти в{" "}
                    <a
                      href="https://seller.ozon.ru/app/settings/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      style={{ color: "#3F1111" }}
                    >
                      Личном кабинете Ozon Seller
                    </a>{" "}
                    → Настройки → API ключи.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle} style={{ color: "#191E1B" }}>
                    Client ID (ID продавца)
                  </label>
                  <input
                    type="text"
                    value={ozonClientId}
                    onChange={(e) => setOzonClientId(e.target.value)}
                    placeholder="123456"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle} style={{ color: "#191E1B" }}>
                    API Key (ключ продавца)
                  </label>
                  <input
                    type="password"
                    value={ozonApiKey}
                    onChange={(e) => setOzonApiKey(e.target.value)}
                    placeholder="Оставьте пустым, чтобы не менять"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button
                  onClick={saveOzon}
                  disabled={ozonSaving}
                  className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                  style={{ background: "#3F1111", color: "#FAFAFA" }}
                >
                  {ozonSaving ? "Сохранение..." : "Сохранить ключи"}
                </button>
                {ozonMsg && (
                  <span className="text-sm flex items-center gap-1" style={{ color: "#10b981" }}>
                    <Check size={14} /> {ozonMsg}
                  </span>
                )}
              </div>

              {/* ── Импорт товаров ── */}
              <div className="mt-5 pt-5 border-t" style={{ borderColor: "#F7F0EC" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#191E1B" }}>
                  Импорт товаров из Ozon
                </p>
                <p className="text-xs mb-3" style={{ color: "#9a9a9a" }}>
                  Загружает все ваши товары с Ozon (название, артикул, фото, цену, описание).
                  Уже существующие товары не затрагиваются.
                </p>
                <button
                  onClick={handleImportFromOzon}
                  disabled={importing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
                  style={{ background: "#005BFF", color: "#fff" }}
                >
                  <PackagePlus size={16} />
                  {importing ? "Импорт идёт..." : "Добавить все товары из Ozon"}
                </button>
                {importing && (
                  <p className="text-xs mt-2 animate-pulse" style={{ color: "#9a9a9a" }}>
                    Получаем данные от Ozon — это может занять 30–60 секунд...
                  </p>
                )}
                {importResult && (
                  <div
                    className="mt-3 px-4 py-3 rounded-lg text-sm"
                    style={{
                      background: importResult.error ? "#fee2e2" : "#d1fae5",
                      color: importResult.error ? "#dc2626" : "#065f46",
                    }}
                  >
                    {importResult.error
                      ? `❌ ${importResult.error}`
                      : `✅ ${importResult.message}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Промокоды ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => toggleSection("promo")}
          >
            <span className="text-sm font-semibold" style={{ color: "#191E1B" }}>
              Промокоды
            </span>
            {sections.find((s) => s.id === "promo")?.expanded ? (
              <ChevronUp size={16} style={{ color: "#9a9a9a" }} />
            ) : (
              <ChevronDown size={16} style={{ color: "#9a9a9a" }} />
            )}
          </button>
          {sections.find((s) => s.id === "promo")?.expanded && (
            <div className="px-5 pb-5 border-t" style={{ borderColor: "#F7F0EC" }}>
              <form onSubmit={handleCreatePromo}>
                <div className="grid grid-cols-4 gap-3 mt-4 mb-4">
                  <div>
                    <label className={labelStyle} style={{ color: "#191E1B" }}>Код *</label>
                    <input
                      required
                      type="text"
                      value={newPromo.code}
                      onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      placeholder="SUMMER20"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle} style={{ color: "#191E1B" }}>Скидка % *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      value={newPromo.discountPercent}
                      onChange={(e) => setNewPromo((p) => ({ ...p, discountPercent: e.target.value }))}
                      placeholder="10"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle} style={{ color: "#191E1B" }}>Макс. использований</label>
                    <input
                      type="number"
                      min="1"
                      value={newPromo.maxUses}
                      onChange={(e) => setNewPromo((p) => ({ ...p, maxUses: e.target.value }))}
                      placeholder="∞"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle} style={{ color: "#191E1B" }}>Действует до</label>
                    <input
                      type="date"
                      value={newPromo.expiresAt}
                      onChange={(e) => setNewPromo((p) => ({ ...p, expiresAt: e.target.value }))}
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={promoSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                  style={{ background: "#3F1111", color: "#FAFAFA" }}
                >
                  <Plus size={15} />
                  {promoSaving ? "Создание..." : "Создать промокод"}
                </button>
              </form>

              {promosLoading ? (
                <p className="text-sm mt-4" style={{ color: "#9a9a9a" }}>Загрузка...</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm mt-4 min-w-[680px]">
                  <thead>
                    <tr style={{ background: "#F7F0EC" }}>
                      {["Код", "Скидка", "Применений", "Заказов", "Истекает", "Статус", ""].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium" style={{ color: "#9a9a9a" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map((p) => (
                      <tr key={p.id} className="border-t" style={{ borderColor: "#F7F0EC" }}>
                        <td className="px-3 py-2 font-mono font-medium" style={{ color: "#191E1B" }}>
                          {p.code}
                        </td>
                        <td className="px-3 py-2" style={{ color: "#3F1111" }}>
                          {p.discountPercent}%
                        </td>
                        <td className="px-3 py-2" style={{ color: "#191E1B" }}>
                          {p.appliedCount ?? 0}
                        </td>
                        <td className="px-3 py-2" style={{ color: "#191E1B" }}>
                          {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : " / ∞"}
                        </td>
                        <td className="px-3 py-2" style={{ color: "#9a9a9a" }}>
                          {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("ru-RU") : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: p.isActive ? "#d1fae520" : "#fee2e220",
                              color: p.isActive ? "#059669" : "#ef4444",
                            }}
                          >
                            {p.isActive ? "Активен" : "Отключён"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTogglePromo(p.id, p.isActive)}
                              className="p-1 rounded hover:bg-gray-100"
                              title={p.isActive ? "Отключить" : "Включить"}
                            >
                              {p.isActive ? (
                                <ToggleRight size={16} style={{ color: "#059669" }} />
                              ) : (
                                <ToggleLeft size={16} style={{ color: "#9a9a9a" }} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeletePromo(p.id, p.code)}
                              className="p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 size={14} style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!promos.length && !promosLoading && (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-center" style={{ color: "#9a9a9a" }}>
                          Нет промокодов
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
