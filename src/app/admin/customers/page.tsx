"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CustomerOrder {
  number: string;
  status: string;
  total: number;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  orders: CustomerOrder[];
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

export default function AdminCustomersPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/customers", { headers: getAuthHeaders() });
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.customers ?? []);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const fmtPhone = (p: string) => {
    if (!p || p.length !== 10) return p;
    return `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>Покупатели</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#9a9a9a" }}>
            Загрузка...
          </div>
        ) : !customers.length ? (
          <div className="p-8 text-center" style={{ color: "#9a9a9a" }}>
            Покупатели не найдены
          </div>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ background: "#F7F0EC" }}>
                {["Имя", "Телефон", "Регистрация", "Заказов", "Сумма", ""].map((h) => (
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
              {customers.map((c, i) => {
                const expanded = expandedId === c.id;
                return (
                  <>
                    <tr
                      key={c.id}
                      className="border-t cursor-pointer hover:bg-amber-50 transition-colors"
                      style={{
                        borderColor: "#F7F0EC",
                        background: expanded ? "#FFF8F5" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}
                      onClick={() => setExpandedId(expanded ? null : c.id)}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "#191E1B" }}>
                        {c.name || "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#191E1B" }}>
                        {fmtPhone(c.phone)}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9a9a9a" }}>
                        {fmtDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#191E1B" }}>
                        {c.ordersCount}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#191E1B" }}>
                        {fmtCurrency(c.totalSpent)}
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
                        key={`${c.id}-detail`}
                        style={{ background: "#FFF8F5" }}
                        className="border-t"
                      >
                        <td colSpan={6} className="px-8 py-4">
                          <p className="text-xs font-semibold mb-2" style={{ color: "#9a9a9a" }}>
                            История заказов
                          </p>
                          {c.orders.length ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr style={{ color: "#9a9a9a" }}>
                                  <th className="text-left pb-1 font-medium">Номер</th>
                                  <th className="text-left pb-1 font-medium">Дата</th>
                                  <th className="text-left pb-1 font-medium">Статус</th>
                                  <th className="text-right pb-1 font-medium">Сумма</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.orders.map((o) => (
                                  <tr key={o.number} className="border-t" style={{ borderColor: "#F7F0EC" }}>
                                    <td className="py-1.5 font-mono text-xs" style={{ color: "#3F1111" }}>
                                      {o.number}
                                    </td>
                                    <td className="py-1.5" style={{ color: "#9a9a9a" }}>
                                      {fmtDate(o.createdAt)}
                                    </td>
                                    <td className="py-1.5">
                                      <span
                                        className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                                        style={{
                                          background: `${STATUS_COLORS[o.status] ?? "#9a9a9a"}15`,
                                          color: STATUS_COLORS[o.status] ?? "#191E1B",
                                        }}
                                      >
                                        {STATUS_LABELS[o.status] ?? o.status}
                                      </span>
                                    </td>
                                    <td className="py-1.5 text-right font-medium" style={{ color: "#191E1B" }}>
                                      {fmtCurrency(o.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-sm" style={{ color: "#9a9a9a" }}>
                              Нет заказов
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
