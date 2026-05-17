"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { TrendingUp, ShoppingBag, DollarSign, BarChart3 } from "lucide-react";

interface AnalyticsData {
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  visitsByDay: { date: string; visits: number }[];
  ordersByDay: { date: string; orders: number; revenue: number }[];
  topProducts: {
    productId: string;
    views: number;
    cartAdds: number;
    product?: { nameRu: string; price: number };
  }[];
}

interface RecentOrder {
  id: string;
  number: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: `${color}18` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-semibold" style={{ color: "#191E1B" }}>
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function CssBarChart({
  data,
  valueKey,
  labelKey,
  color,
}: {
  data: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  color: string;
}) {
  if (!data.length) return <p className="text-sm text-gray-400">Нет данных</p>;
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const maxVal = Math.max(...values, 1);
  const showLabels = data.length <= 14;
  // Зона баров — явная высота в px, чтобы height:X% работал корректно
  const BAR_AREA = 96;
  const LABEL_AREA = showLabels ? 20 : 0;

  return (
    <div style={{ width: "100%" }}>
      {/* Зона баров */}
      <div
        className="flex items-end gap-px w-full"
        style={{ height: BAR_AREA }}
      >
        {data.map((d, i) => {
          const val = Number(d[valueKey] ?? 0);
          const pct = Math.max((val / maxVal) * 100, val > 0 ? 3 : 1);
          return (
            <div
              key={i}
              className="flex-1 relative group"
              style={{ height: "100%", minWidth: 0 }}
            >
              {/* Бар — прилеплен к низу */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t"
                style={{ height: `${pct}%`, background: color }}
              />
              {/* Тултип */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-[#191E1B] text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none"
                style={{ zIndex: 20 }}
              >
                {String(d[labelKey])}: {val}
              </div>
            </div>
          );
        })}
      </div>
      {/* Метки дат под баром — отдельный flex-ряд */}
      {showLabels && (
        <div
          className="flex gap-px w-full"
          style={{ height: LABEL_AREA, marginTop: 2 }}
        >
          {data.map((d, i) => {
            const label = String(d[labelKey] ?? "").slice(5); // MM-DD
            return (
              <div
                key={i}
                className="flex-1 flex items-start justify-center overflow-hidden"
                style={{ minWidth: 0 }}
              >
                <span
                  className="text-[8px] block"
                  style={{ color: "#9a9a9a", transform: "rotate(45deg)", transformOrigin: "left top" }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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

export default function AdminDashboardPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const headers = getAuthHeaders();
        const [analyticsRes, ordersRes] = await Promise.all([
          fetch("/api/admin/analytics?period=30d", { headers }),
          fetch("/api/admin/orders", { headers }),
        ]);
        if (analyticsRes.ok) setData(await analyticsRes.json());
        if (ordersRes.ok) {
          const o = await ordersRes.json();
          setOrders((o.orders ?? []).slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "#9a9a9a" }}>Загрузка...</p>
      </div>
    );
  }

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: "#191E1B" }}>
        Dashboard
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Визиты (30 дней)"
          value={(data?.totalVisits ?? 0).toLocaleString("ru-RU")}
          color="#3F1111"
        />
        <StatCard
          icon={ShoppingBag}
          label="Заказы (30 дней)"
          value={(data?.totalOrders ?? 0).toLocaleString("ru-RU")}
          color="#3b82f6"
        />
        <StatCard
          icon={DollarSign}
          label="Выручка (30 дней)"
          value={fmtCurrency(data?.totalRevenue ?? 0)}
          color="#10b981"
        />
        <StatCard
          icon={BarChart3}
          label="Конверсия"
          value={`${data?.conversionRate ?? 0}%`}
          color="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Visits chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
            Визиты по дням
          </h2>
          <CssBarChart
            data={data?.visitsByDay ?? []}
            valueKey="visits"
            labelKey="date"
            color="#3F1111"
          />
        </div>

        {/* Orders chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
            Заказы по дням
          </h2>
          <CssBarChart
            data={data?.ordersByDay ?? []}
            valueKey="orders"
            labelKey="date"
            color="#3b82f6"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
            Топ товары (30 дней)
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "#9a9a9a" }}>
                <th className="text-left pb-2 font-medium">Товар</th>
                <th className="text-right pb-2 font-medium">Просм.</th>
                <th className="text-right pb-2 font-medium">Корзина</th>
                <th className="text-right pb-2 font-medium">Конв.</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topProducts ?? []).slice(0, 5).map((p, i) => {
                const conv =
                  p.views > 0
                    ? ((p.cartAdds / p.views) * 100).toFixed(1)
                    : "0";
                return (
                  <tr
                    key={p.productId}
                    className="border-t"
                    style={{ borderColor: "#F7F0EC" }}
                  >
                    <td className="py-2 pr-2" style={{ color: "#191E1B" }}>
                      <span
                        className="inline-block w-5 h-5 rounded text-xs text-center leading-5 mr-2"
                        style={{ background: "#F7F0EC", color: "#9a9a9a" }}
                      >
                        {i + 1}
                      </span>
                      {p.product?.nameRu ?? p.productId}
                    </td>
                    <td className="py-2 text-right" style={{ color: "#191E1B" }}>
                      {p.views}
                    </td>
                    <td className="py-2 text-right" style={{ color: "#191E1B" }}>
                      {p.cartAdds}
                    </td>
                    <td className="py-2 text-right" style={{ color: "#10b981" }}>
                      {conv}%
                    </td>
                  </tr>
                );
              })}
              {!data?.topProducts?.length && (
                <tr>
                  <td colSpan={4} className="py-4 text-center" style={{ color: "#9a9a9a" }}>
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
            Последние заказы
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "#9a9a9a" }}>
                <th className="text-left pb-2 font-medium">Номер</th>
                <th className="text-left pb-2 font-medium">Клиент</th>
                <th className="text-right pb-2 font-medium">Сумма</th>
                <th className="text-left pb-2 font-medium pl-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t"
                  style={{ borderColor: "#F7F0EC" }}
                >
                  <td className="py-2 font-mono text-xs" style={{ color: "#3F1111" }}>
                    {o.number}
                  </td>
                  <td className="py-2" style={{ color: "#191E1B" }}>
                    {o.customerName}
                  </td>
                  <td className="py-2 text-right" style={{ color: "#191E1B" }}>
                    {fmtCurrency(o.total)}
                  </td>
                  <td className="py-2 pl-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: `${STATUS_COLORS[o.status] ?? "#9a9a9a"}20`,
                        color: STATUS_COLORS[o.status] ?? "#9a9a9a",
                      }}
                    >
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={4} className="py-4 text-center" style={{ color: "#9a9a9a" }}>
                    Нет заказов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
