"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Search, ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  qty: number;
  price: number;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  total: number;
  deliveryType: string;
  status: string;
  ozonPostingId?: string | null;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Новый",
  PAID: "Оплачен",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
  RETURNED: "Возврат",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PAID: "#10b981",
  PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444",
  RETURNED: "#6b7280",
};

const DELIVERY_LABELS: Record<string, string> = {
  OZON_PVZ: "Ozon ПВЗ",
  OZON_COURIER: "Ozon Курьер",
};

const STATUS_TABS = ["all", "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
const TAB_LABELS: Record<string, string> = {
  all: "Все",
  ...STATUS_LABELS,
};

export default function AdminOrdersPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingOzon, setSendingOzon] = useState<string | null>(null);
  const [ozonError, setOzonError] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load(status?: string) {
    const headers = getAuthHeaders();
    const url = status && status !== "all"
      ? `/api/admin/orders?status=${status}`
      : "/api/admin/orders";
    const res = await fetch(url, { headers });
    if (res.ok) {
      const d = await res.json();
      setOrders(d.orders ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load(statusTab);
    // Авто-обновление: заказы, оплаченные через Т-Банка (webhook ставит PAID),
    // появляются сами без перезагрузки страницы.
    const id = setInterval(() => load(statusTab), 20000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab]);

  async function handleSyncStatuses() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/admin/ozon/sync-statuses", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(data.message ?? "Готово");
        await load(statusTab);
      } else {
        setSyncMsg(data.error ?? "Ошибка синхронизации");
      }
    } catch {
      setSyncMsg("Ошибка соединения");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 5000);
    }
  }

  async function handleSendToOzon(orderId: string) {
    setSendingOzon(orderId);
    setOzonError({});
    try {
      const res = await fetch(`/api/admin/ozon/send-order/${orderId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        await load(statusTab);
      } else {
        setOzonError((prev) => ({ ...prev, [orderId]: data.error }));
      }
    } catch {
      setOzonError((prev) => ({ ...prev, [orderId]: "Ошибка соединения" }));
    } finally {
      setSendingOzon(null);
    }
  }

  async function handleDeleteOrder(orderId: string, number: string) {
    if (!confirm(`Удалить заказ ${number}? Действие необратимо.`)) return;
    setDeletingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setExpandedId(null);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Не удалось удалить заказ");
      }
    } catch {
      alert("Ошибка соединения");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    const headers = getAuthHeaders();
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
    setUpdatingId(null);
  }

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.number.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q)
    );
  });

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>Заказы</h1>
        <div className="flex items-center gap-3">
          {syncMsg && (
            <span className="text-xs" style={{ color: syncMsg.includes("Ошибка") ? "#ef4444" : "#10b981" }}>
              {syncMsg}
            </span>
          )}
          <button
            onClick={handleSyncStatuses}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-60 transition-colors"
            style={{ background: "#F7F0EC", color: "#191E1B", border: "1px solid #e8e0da" }}
            title="Обновить статусы заказов из Ozon"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Синхронизация..." : "Статусы из Ozon"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusTab(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: statusTab === s ? "#3F1111" : "#F7F0EC",
              color: statusTab === s ? "#FAFAFA" : "#191E1B",
            }}
          >
            {TAB_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-4 bg-white"
        style={{ borderColor: "#e8e0da" }}
      >
        <Search size={15} style={{ color: "#9a9a9a" }} />
        <input
          type="text"
          placeholder="Поиск по номеру, имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-sm"
          style={{ color: "#191E1B" }}
        />
      </div>

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
                {["Номер", "Дата", "Клиент", "Телефон", "Сумма", "Доставка", "Статус", ""].map((h) => (
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
              {filtered.map((o, i) => {
                const expanded = expandedId === o.id;
                return (
                  <>
                    <tr
                      key={o.id}
                      className="border-t cursor-pointer hover:bg-amber-50 transition-colors"
                      style={{
                        borderColor: "#F7F0EC",
                        background: expanded ? "#FFF8F5" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}
                      onClick={() => setExpandedId(expanded ? null : o.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "#3F1111" }}>
                        {o.number}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9a9a9a" }}>
                        {fmtDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#191E1B" }}>
                        {o.customerName}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#191E1B" }}>
                        {o.customerPhone}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#191E1B" }}>
                        {fmtCurrency(o.total)}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9a9a9a" }}>
                        {DELIVERY_LABELS[o.deliveryType] ?? o.deliveryType}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          disabled={updatingId === o.id}
                          className="border rounded-lg px-2 py-1 text-xs outline-none"
                          style={{
                            borderColor: STATUS_COLORS[o.status] ?? "#e8e0da",
                            color: STATUS_COLORS[o.status] ?? "#191E1B",
                            background: `${STATUS_COLORS[o.status] ?? "#9a9a9a"}15`,
                          }}
                        >
                          {Object.keys(STATUS_LABELS).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {expanded ? (
                          <ChevronUp size={14} style={{ color: "#9a9a9a" }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: "#9a9a9a" }} />
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr
                        key={`${o.id}-detail`}
                        style={{ background: "#FFF8F5" }}
                        className="border-t"
                      >
                        <td colSpan={8} className="px-8 py-4">
                          <div className="flex gap-8">
                            <div className="flex flex-col gap-4">
                              <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: "#9a9a9a" }}>
                                  Контакты
                                </p>
                                <p className="text-sm" style={{ color: "#191E1B" }}>
                                  {o.customerEmail}
                                </p>
                                <p className="text-sm" style={{ color: "#191E1B" }}>
                                  {o.customerPhone}
                                </p>
                              </div>

                              {/* Ozon send button */}
                              <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: "#9a9a9a" }}>
                                  Ozon Логистика
                                </p>
                                {o.ozonPostingId ? (
                                  <div>
                                    <span
                                      className="inline-block text-xs px-2.5 py-1 rounded-full font-medium mb-1"
                                      style={{ background: "#d1fae5", color: "#065f46" }}
                                    >
                                      ✓ Отправлен в Ozon
                                    </span>
                                    <p className="text-xs font-mono" style={{ color: "#9a9a9a" }}>
                                      {o.ozonPostingId}
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSendToOzon(o.id); }}
                                      disabled={sendingOzon === o.id || o.status === "CANCELLED" || o.status === "RETURNED"}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                      style={{ background: "#005BFF", color: "#fff" }}
                                    >
                                      {sendingOzon === o.id ? "Отправка…" : "→ Отправить в Ozon"}
                                    </button>
                                    {ozonError[o.id] && (
                                      <p className="mt-1.5 text-xs leading-snug max-w-[220px]" style={{ color: "#ef4444" }}>
                                        {ozonError[o.id]}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold mb-2" style={{ color: "#9a9a9a" }}>
                                Товары
                              </p>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr style={{ color: "#9a9a9a" }}>
                                    <th className="text-left pb-1 font-medium">Товар</th>
                                    <th className="text-left pb-1 font-medium">Параметры</th>
                                    <th className="text-right pb-1 font-medium">Кол-во</th>
                                    <th className="text-right pb-1 font-medium">Цена</th>
                                    <th className="text-right pb-1 font-medium">Сумма</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {o.items?.map((item) => (
                                    <tr key={item.id} className="border-t" style={{ borderColor: "#F7F0EC" }}>
                                      <td className="py-1" style={{ color: "#191E1B" }}>{item.name}</td>
                                      <td className="py-1 text-xs" style={{ color: "#9a9a9a" }}>{item.size ?? ""} {item.color ?? ""}</td>
                                      <td className="py-1 text-right" style={{ color: "#191E1B" }}>{item.qty}</td>
                                      <td className="py-1 text-right" style={{ color: "#191E1B" }}>{fmtCurrency(item.price)}</td>
                                      <td className="py-1 text-right font-medium" style={{ color: "#191E1B" }}>{fmtCurrency(item.price * item.qty)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Удаление заказа */}
                          <div className="mt-6 pt-4 flex justify-end" style={{ borderTop: "1px solid #F7F0EC" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteOrder(o.id, o.number); }}
                              disabled={deletingId === o.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              style={{ background: "#fee2e2", color: "#dc2626" }}
                            >
                              <Trash2 size={13} />
                              {deletingId === o.id ? "Удаление…" : "Удалить заказ"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {!filtered.length && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center" style={{ color: "#9a9a9a" }}>
                    Заказы не найдены
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
