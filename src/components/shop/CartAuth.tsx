"use client";
import { useState } from "react";

interface Props {
  defaultPhone?: string;
  onAuthed: (data: { token: string; name: string; phone: string }) => void;
}

/**
 * Блок авторизации внутри оформления заказа.
 * Покупатель входит или регистрируется по телефону+паролю, после чего
 * заказ привязывается к его кабинету (отслеживание заказов).
 */
export default function CartAuth({ defaultPhone, onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState(defaultPhone || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const url = mode === "login" ? "/api/account/login" : "/api/account/register";
      const body = mode === "login" ? { phone, password } : { phone, password, name };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("customer_token", data.token);
        localStorage.setItem("customer_name", data.name ?? name ?? "");
        localStorage.setItem("customer_phone", phone);
        onAuthed({ token: data.token, name: data.name ?? name ?? "", phone });
      } else {
        setError(data.error ?? "Ошибка");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors border-[#e8e0da] focus:border-[#191E1B]";

  return (
    <div className="border border-[#e8e0da] p-6 bg-white">
      <p className="font-prata text-[18px] text-[#191E1B] mb-1">
        {mode === "login" ? "Вход в кабинет" : "Регистрация"}
      </p>
      <p className="text-[12px] text-[#9a9a9a] mb-5">
        Чтобы оформить заказ и отслеживать его, войдите или зарегистрируйтесь по телефону.
      </p>

      <div className="flex gap-2 mb-5">
        {(["login", "register"] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(""); }}
            className="flex-1 py-2.5 text-[11px] tracking-[0.14em] uppercase transition-colors"
            style={{
              background: mode === m ? "#3F1111" : "#fff",
              color: mode === m ? "#FAFAFA" : "#9a9a9a",
              border: "1px solid " + (mode === m ? "#3F1111" : "#e8e0da"),
            }}>
            {m === "login" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Имя" className={inputCls} />
        )}
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (___) ___-__-__" className={inputCls} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль" className={inputCls} />

        {error && <p className="text-[12px] text-[#3F1111]">{error}</p>}

        <button type="submit" disabled={busy}
          className="w-full bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-3.5 hover:bg-[#5a1a1a] transition-colors disabled:opacity-50">
          {busy ? "..." : mode === "login" ? "Войти и продолжить" : "Зарегистрироваться и продолжить"}
        </button>
      </form>
    </div>
  );
}
