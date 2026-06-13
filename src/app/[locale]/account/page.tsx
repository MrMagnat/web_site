"use client";
import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Package, LogOut } from "lucide-react";

interface OrderItem { name: string; qty: number; price: number; }
interface Order {
  number: string;
  status: string;
  total: number;
  createdAt: string;
  deliveryType: string;
  pvzAddress?: string | null;
  deliveryAddress?: string | null;
  ozonTrackingId?: string | null;
  items: OrderItem[];
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Ожидает оплаты",     color: "#d97706", bg: "#fef3c7" },
  PAID:       { label: "Оплачен",            color: "#059669", bg: "#d1fae5" },
  PROCESSING: { label: "В обработке",        color: "#2563eb", bg: "#dbeafe" },
  SHIPPED:    { label: "Передан в доставку", color: "#7c3aed", bg: "#ede9fe" },
  DELIVERED:  { label: "Доставлен",          color: "#065f46", bg: "#d1fae5" },
  CANCELLED:  { label: "Отменён",            color: "#dc2626", bg: "#fee2e2" },
  RETURNED:   { label: "Возврат",            color: "#6b7280", bg: "#f3f4f6" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export default function AccountPage() {
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // form
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("customer_token");
    const n = localStorage.getItem("customer_name") || "";
    if (t) { setToken(t); setName(n); }
  }, []);

  const loadOrders = useCallback(async (t: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/account/orders", { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const d = await res.json();
        setOrders(d.orders ?? []);
      } else if (res.status === 401) {
        // токен истёк
        localStorage.removeItem("customer_token");
        setToken(null);
      }
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadOrders(token);
  }, [token, loadOrders]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const url = mode === "login" ? "/api/account/login" : "/api/account/register";
      const body = mode === "login"
        ? { phone, password }
        : { phone, password, name: regName };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("customer_token", data.token);
        localStorage.setItem("customer_name", data.name ?? "");
        setToken(data.token);
        setName(data.name ?? "");
      } else {
        setError(data.error ?? "Ошибка");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_name");
    setToken(null);
    setOrders(null);
    setPhone(""); setPassword("");
  }

  const inputCls = "w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors border-[#e8e0da] focus:border-[#191E1B]";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[72px]">
        <div className="max-w-[760px] mx-auto px-6 md:px-8 py-14">

          {!token ? (
            /* ── Вход / регистрация ── */
            <div className="max-w-[420px] mx-auto">
              <h1 className="font-prata text-[28px] md:text-[34px] text-[#191E1B] mb-2">
                Личный кабинет
              </h1>
              <p className="text-[14px] text-[#9a9a9a] mb-8">
                {mode === "login"
                  ? "Войдите, чтобы видеть свои заказы и их статусы"
                  : "Зарегистрируйтесь по номеру телефона"}
              </p>

              <div className="flex gap-2 mb-6">
                {(["login", "register"] as const).map((m) => (
                  <button key={m} onClick={() => { setMode(m); setError(""); }}
                    className="flex-1 py-2.5 text-[12px] tracking-[0.14em] uppercase transition-colors"
                    style={{
                      background: mode === m ? "#3F1111" : "#fff",
                      color: mode === m ? "#FAFAFA" : "#9a9a9a",
                      border: "1px solid " + (mode === m ? "#3F1111" : "#e8e0da"),
                    }}>
                    {m === "login" ? "Вход" : "Регистрация"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                    placeholder="Имя (необязательно)" className={inputCls} />
                )}
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__" className={inputCls} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль" className={inputCls} />

                {error && <p className="text-[12px] text-[#3F1111]">{error}</p>}

                <button type="submit" disabled={busy}
                  className="w-full bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-4 hover:bg-[#5a1a1a] transition-colors disabled:opacity-50">
                  {busy ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
                </button>
              </form>
            </div>
          ) : (
            /* ── Кабинет с заказами ── */
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-prata text-[28px] md:text-[34px] text-[#191E1B]">
                    {name ? `Здравствуйте, ${name}` : "Мои заказы"}
                  </h1>
                  <p className="text-[13px] text-[#9a9a9a] mt-1">Ваши заказы и их статусы</p>
                </div>
                <button onClick={logout}
                  className="flex items-center gap-1.5 text-[12px] text-[#9a9a9a] hover:text-[#3F1111] transition-colors">
                  <LogOut size={14} /> Выйти
                </button>
              </div>

              {loadingOrders ? (
                <p className="text-[14px] text-[#9a9a9a]">Загрузка...</p>
              ) : !orders || orders.length === 0 ? (
                <div className="border border-[#e8e0da] bg-white px-6 py-12 text-center">
                  <Package size={28} strokeWidth={1.5} className="mx-auto mb-3 text-[#9a9a9a]" />
                  <p className="text-[14px] text-[#191E1B] mb-1">Заказов пока нет</p>
                  <p className="text-[13px] text-[#9a9a9a]">
                    Заказы появятся здесь после оформления на этот номер телефона
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => {
                    const st = STATUS[o.status] ?? { label: o.status, color: "#6b7280", bg: "#f3f4f6" };
                    return (
                      <div key={o.number} className="border border-[#e8e0da] bg-white p-5">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div>
                            <p className="font-prata text-[16px] text-[#3F1111]">{o.number}</p>
                            <p className="text-[11px] text-[#9a9a9a]">
                              {new Date(o.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <span className="text-[12px] px-3 py-1 rounded-full font-medium"
                            style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                        </div>

                        <div className="space-y-1 mb-3">
                          {o.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-[13px]">
                              <span className="text-[#9a9a9a]">{it.name} × {it.qty}</span>
                              <span className="text-[#191E1B]">{fmt(it.price * it.qty)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#F7F0EC]">
                          <span className="text-[12px] text-[#9a9a9a]">
                            {o.deliveryType === "OZON_PVZ" ? "ПВЗ Ozon" : "Курьер Ozon"}
                            {o.ozonTrackingId ? ` · трек ${o.ozonTrackingId}` : ""}
                          </span>
                          <span className="text-[14px] font-medium text-[#191E1B]">{fmt(o.total)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
