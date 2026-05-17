"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { TrendingUp, ShoppingBag, DollarSign, BarChart3 } from "lucide-react";

interface DayData {
  date: string;
  visits?: number;
  orders?: number;
  revenue?: number;
}

interface TopProduct {
  productId: string;
  views: number;
  cartAdds: number;
  product?: { nameRu: string; price: number };
}

interface UTMStat {
  source: string;
  clicks: number;
  orders: number;
}

interface AnalyticsData {
  period: string;
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  visitsByDay: DayData[];
  ordersByDay: DayData[];
  topProducts: TopProduct[];
  utmStats: UTMStat[];
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
  color,
}: {
  data: DayData[];
  valueKey: "visits" | "orders" | "revenue";
  color: string;
}) {
  if (!data.length)
    return <p className="text-xs" style={{ color: "#9a9a9a" }}>Нет данных</p>;
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const maxVal = Math.max(...values, 1);

  return (
    // Явная высота на контейнере + position: relative на каждом столбце
    // чтобы height: X% внутри разрешался корректно
    <div
      className="w-full flex items-end gap-px"
      style={{ height: 112 }}
    >
      {data.map((d, i) => {
        const val = Number(d[valueKey] ?? 0);
        const pct = Math.max((val / maxVal) * 100, 2);
        return (
          <div
            key={i}
            className="flex-1 relative group"
            style={{ height: "100%", minWidth: 0 }}
          >
            {/* Бар — прилеплен к низу столбца */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t"
              style={{ height: `${pct}%`, background: color }}
            />
            {/* Tooltip — появляется над баром при hover */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-[#191E1B] text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none"
              style={{ zIndex: 20 }}
            >
              {d.date}:{" "}
              {valueKey === "revenue"
                ? `${val.toLocaleString("ru-RU")} ₽`
                : val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({ data }: { data: UTMStat[] }) {
  if (!data.length)
    return <p className="text-xs" style={{ color: "#9a9a9a" }}>Нет данных</p>;
  const max = Math.max(...data.map((d) => d.clicks), 1);
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => {
        const pct = (d.clicks / max) * 100;
        return (
          <div key={d.source}>
            {/* Название источника + кол-во кликов */}
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs truncate"
                style={{ color: "#191E1B", maxWidth: "70%" }}
              >
                {d.source}
              </span>
              <span className="text-xs font-medium" style={{ color: "#3F1111" }}>
                {d.clicks}
              </span>
            </div>
            {/* Бар на отдельной строке — никакого наложения на текст */}
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 6, background: "#F7F0EC" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: "#3F1111" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PERIODS = [
  { label: "7 дней", value: "7d" },
  { label: "30 дней", value: "30d" },
  { label: "90 дней", value: "90d" },
];

export default function AdminAnalyticsPage() {
  const { getAuthHeaders } = useAdminAuth();
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/analytics?period=${period}`, { headers });
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "#191E1B" }}>
          Аналитика
        </h1>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: period === p.value ? "#3F1111" : "#F7F0EC",
                color: period === p.value ? "#FAFAFA" : "#191E1B",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p style={{ color: "#9a9a9a" }}>Загрузка...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={TrendingUp}
              label="Визиты"
              value={(data?.totalVisits ?? 0).toLocaleString("ru-RU")}
              color="#3F1111"
            />
            <StatCard
              icon={ShoppingBag}
              label="Заказы"
              value={(data?.totalOrders ?? 0).toLocaleString("ru-RU")}
              color="#3b82f6"
            />
            <StatCard
              icon={DollarSign}
              label="Выручка"
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

          {/* Charts */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
                Визиты по дням
              </h2>
              <CssBarChart
                data={data?.visitsByDay ?? []}
                valueKey="visits"
                color="#3F1111"
              />
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
                Заказы по дням
              </h2>
              <CssBarChart
                data={data?.ordersByDay ?? []}
                valueKey="orders"
                color="#3b82f6"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
                Выручка по дням (₽)
              </h2>
              <CssBarChart
                data={data?.ordersByDay ?? []}
                valueKey="revenue"
                color="#10b981"
              />
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
                UTM-источники (кликов)
              </h2>
              <HorizontalBarChart data={data?.utmStats ?? []} />
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#191E1B" }}>
              Топ товаров
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "#9a9a9a" }}>
                  <th className="text-left pb-2 font-medium">Товар</th>
                  <th className="text-right pb-2 font-medium">Просмотры</th>
                  <th className="text-right pb-2 font-medium">В корзину</th>
                  <th className="text-right pb-2 font-medium">Конверсия</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topProducts ?? []).map((p, i) => {
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
                      <td className="py-2" style={{ color: "#191E1B" }}>
                        <span
                          className="inline-block w-5 h-5 rounded text-xs text-center leading-5 mr-2"
                          style={{ background: "#F7F0EC", color: "#9a9a9a" }}
                        >
                          {i + 1}
                        </span>
                        {p.product?.nameRu ?? p.productId}
                      </td>
                      <td className="py-2 text-right" style={{ color: "#191E1B" }}>
                        {p.views.toLocaleString("ru-RU")}
                      </td>
                      <td className="py-2 text-right" style={{ color: "#191E1B" }}>
                        {p.cartAdds.toLocaleString("ru-RU")}
                      </td>
                      <td className="py-2 text-right" style={{ color: "#10b981" }}>
                        {conv}%
                      </td>
                    </tr>
                  );
                })}
                {!data?.topProducts?.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center"
                      style={{ color: "#9a9a9a" }}
                    >
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
