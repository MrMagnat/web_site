"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";

interface Return {
  id: string;
  number: string;
  createdAt: string;
  reason: string;
  returnMethod: string;
  status: string;
  comment?: string;
  customerName?: string;
  customerEmail?: string;
  order: {
    id: string;
    number: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    total: number;
  };
}

const METHOD_LABELS: Record<string, string> = {
  DIRECT: "Прямая отправка",
  OZON: "Через ПВЗ Ozon",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Новая",
  REVIEWING: "На рассмотрении",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  REVIEWING: "#3b82f6",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
};

const STATUS_TABS = ["all", "PENDING", "REVIEWING", "APPROVED", "REJECTED"];
const TAB_LABELS: Record<string, string> = { all: "Все", ...STATUS_LABELS };

export default function AdminReturnsPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    const headers = getAuthHeaders();
    const res = await fetch("/api/admin/returns", { headers });
    if (res.ok) {
      const d = await res.json();
      setReturns(d.returns ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    setUpdating(id);
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/returns/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status, comment: comments[id] ?? "" }),
    });
    if (res.ok) {
      setReturns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, comment: comments[id] ?? "" } : r
        )
      );
      setExpandedId(null);
    }
    setUpdating(null);
  }

  const filtered =
    statusTab === "all"
      ? returns
      : returns.filter((r) => r.status === statusTab);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: "#191E1B" }}>
        Возвраты
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusTab(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: statusTab === s ? "#3F1111" : "#F7F0EC",
              color: statusTab === s ? "#FAFAFA" : "#191E1B",
            }}
          >
            {TAB_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#9a9a9a" }}>
            Загрузка...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F0EC" }}>
                {["№ заявки", "Дата", "Заказ", "Способ", "Причина", "Статус", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: "#9a9a9a" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const expanded = expandedId === r.id;
                return (
                  <>
                    <tr
                      key={r.id}
                      className="border-t cursor-pointer hover:bg-amber-50 transition-colors"
                      style={{
                        borderColor: "#F7F0EC",
                        background: expanded ? "#FFF8F5" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: "#3F1111" }}>
                        {r.number ?? r.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9a9a9a" }}>
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium font-mono text-xs" style={{ color: "#3F1111" }}>
                          {r.order.number}
                        </p>
                        <p className="text-xs" style={{ color: "#9a9a9a" }}>
                          {r.customerName ?? r.order.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: r.returnMethod === "OZON" ? "#3b82f620" : "#f59e0b20",
                            color: r.returnMethod === "OZON" ? "#3b82f6" : "#d97706",
                          }}
                        >
                          {METHOD_LABELS[r.returnMethod] ?? r.returnMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs" style={{ color: "#191E1B" }}>
                        <p className="truncate">{r.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: `${STATUS_COLORS[r.status] ?? "#9a9a9a"}20`,
                            color: STATUS_COLORS[r.status] ?? "#9a9a9a",
                          }}
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {expanded ? (
                          <ChevronUp size={14} style={{ color: "#9a9a9a" }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: "#9a9a9a" }} />
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr
                        key={`${r.id}-detail`}
                        style={{ background: "#FFF8F5" }}
                        className="border-t"
                      >
                        <td colSpan={6} className="px-8 py-5">
                          <div className="flex gap-8">
                            <div className="flex-1">
                              <p
                                className="text-xs font-semibold mb-2"
                                style={{ color: "#9a9a9a" }}
                              >
                                Детали заказа
                              </p>
                              <p className="text-sm" style={{ color: "#191E1B" }}>
                                {r.order.customerName} — {r.order.customerEmail}
                              </p>
                              <p className="text-sm" style={{ color: "#9a9a9a" }}>
                                {r.order.customerPhone}
                              </p>
                              <p className="text-sm mt-1" style={{ color: "#191E1B" }}>
                                Сумма заказа:{" "}
                                <strong>{fmtCurrency(r.order.total)}</strong>
                              </p>
                              <p
                                className="text-xs font-semibold mt-4 mb-2"
                                style={{ color: "#9a9a9a" }}
                              >
                                Причина возврата
                              </p>
                              <p className="text-sm" style={{ color: "#191E1B" }}>
                                {r.reason}
                              </p>
                              {r.comment && (
                                <>
                                  <p
                                    className="text-xs font-semibold mt-3 mb-1"
                                    style={{ color: "#9a9a9a" }}
                                  >
                                    Комментарий менеджера
                                  </p>
                                  <p className="text-sm" style={{ color: "#191E1B" }}>
                                    {r.comment}
                                  </p>
                                </>
                              )}
                            </div>
                            {(r.status === "PENDING" || r.status === "REVIEWING") && (
                              <div className="w-72">
                                <p
                                  className="text-xs font-semibold mb-2"
                                  style={{ color: "#9a9a9a" }}
                                >
                                  Действие
                                </p>
                                <textarea
                                  rows={3}
                                  placeholder="Комментарий (необязательно)"
                                  value={comments[r.id] ?? ""}
                                  onChange={(e) =>
                                    setComments((prev) => ({
                                      ...prev,
                                      [r.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-3"
                                  style={{
                                    borderColor: "#e8e0da",
                                    background: "#fff",
                                    color: "#191E1B",
                                  }}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(r.id, "APPROVED");
                                    }}
                                    disabled={updating === r.id}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                                    style={{ background: "#10b981", color: "#fff" }}
                                  >
                                    <Check size={14} /> Одобрить
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(r.id, "REJECTED");
                                    }}
                                    disabled={updating === r.id}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                                    style={{ background: "#ef4444", color: "#fff" }}
                                  >
                                    <X size={14} /> Отклонить
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {!filtered.length && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center" style={{ color: "#9a9a9a" }}>
                    Возвраты не найдены
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
