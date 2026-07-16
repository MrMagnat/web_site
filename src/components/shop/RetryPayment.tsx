"use client";
import { useState } from "react";

/** Кнопка повторной оплаты заказа по его номеру. */
export default function RetryPayment({ orderNumber }: { orderNumber: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const d = await res.json();
      if (res.ok && d.confirmationUrl) {
        window.location.href = d.confirmationUrl;
      } else {
        setErr(d.error ?? "Не удалось создать платёж. Попробуйте позже.");
        setBusy(false);
      }
    } catch {
      setErr("Ошибка соединения. Попробуйте ещё раз.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-xs">
      <button
        onClick={pay}
        disabled={busy}
        className="w-full block bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-3.5 hover:bg-[#5a1a1a] transition-colors disabled:opacity-50"
      >
        {busy ? "Переходим к оплате..." : "Оплатить заказ снова"}
      </button>
      {err && <p className="mt-2 text-[12px] text-[#3F1111]">{err}</p>}
    </div>
  );
}
