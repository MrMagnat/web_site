"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { CheckCircle, Package, MapPin, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type ReturnMethod = "DIRECT" | "OZON";

interface FormState {
  name: string;
  email: string;
  orderNumber: string;
  reason: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  orderNumber?: string;
  reason?: string;
}

interface SuccessState {
  returnNumber: string;
  method: ReturnMethod;
  email: string;
}

const WAREHOUSE_ADDRESS = "Москва, ул. Складская, д. 10, офис 201 (для возвратов)";
const SUPPORT_EMAIL = "support@andrua-famil.ru";
const TELEGRAM = "https://t.me/Andrua_famil";

export default function ReturnPage() {
  const locale = useLocale();
  const prefix = locale === "ru" ? "" : "/en";

  const [method, setMethod] = useState<ReturnMethod | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", email: "", orderNumber: "", reason: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SuccessState | null>(null);
  const [submitError, setSubmitError] = useState("");

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Введите ваше имя";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Введите корректный email";
    if (!form.orderNumber.trim()) errs.orderNumber = "Введите номер заказа";
    if (!form.reason.trim() || form.reason.trim().length < 10)
      errs.reason = "Опишите причину возврата (минимум 10 символов)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !method) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, returnMethod: method }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitted({ returnNumber: data.returnNumber, method, email: form.email });
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "Произошла ошибка. Попробуйте ещё раз.");
      }
    } catch {
      setSubmitError("Ошибка соединения. Проверьте интернет и попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ─────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <Navbar />
        <main className="flex-1 pt-[72px]">
          <div className="max-w-[640px] mx-auto px-6 md:px-8 py-14">
            <div className="text-center mb-10">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-[#F7F0EC] flex items-center justify-center">
                <CheckCircle size={28} strokeWidth={1.5} className="text-[#3F1111]" />
              </div>
              <h2 className="font-prata text-[28px] text-[#191E1B] mb-2">Заявка принята</h2>
              <p className="text-[14px] text-[#9a9a9a]">
                Ответ придёт на{" "}
                <span className="text-[#191E1B] font-medium">{submitted.email}</span> в течение 24 часов
              </p>
            </div>

            {/* Return number */}
            <div className="bg-[#191E1B] text-white px-6 py-5 mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase text-white/40 mb-1">
                  Номер заявки на возврат
                </p>
                <p className="font-prata text-[22px] tracking-[0.06em]">{submitted.returnNumber}</p>
              </div>
              <p className="text-[11px] text-white/40 text-right leading-relaxed">
                Сохраните номер<br />для отслеживания
              </p>
            </div>

            {/* Instructions */}
            <div className="border border-[#e8e0da] px-6 py-6 mb-8">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#9a9a9a] mb-4">
                Что делать дальше
              </p>

              {submitted.method === "DIRECT" ? (
                <ol className="space-y-4">
                  {[
                    {
                      step: "1",
                      text: "Упакуйте товар в оригинальную или плотную упаковку. Вложите лист с номером заявки и вашим именем.",
                    },
                    {
                      step: "2",
                      text: `Отправьте посылку любым удобным способом (Почта России, СДЭК, Boxberry) по адресу:\n${WAREHOUSE_ADDRESS}`,
                    },
                    {
                      step: "3",
                      text: "Сообщите нам трек-номер отправления в Telegram или по email, чтобы мы могли отследить посылку.",
                    },
                    {
                      step: "4",
                      text: "После получения и проверки товара вернём деньги на ту же карту, с которой был оплачен заказ, в течение 10 рабочих дней.",
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#3F1111] text-white text-[11px] flex items-center justify-center font-medium">
                        {item.step}
                      </span>
                      <p className="text-[13px] text-[#9a9a9a] leading-relaxed whitespace-pre-line">
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="space-y-4">
                  {[
                    {
                      step: "1",
                      text: "Наш менеджер свяжется с вами в течение 24 часов и пришлёт на email ярлык возврата для ПВЗ Ozon.",
                    },
                    {
                      step: "2",
                      text: "Распечатайте ярлык или покажите QR-код на смартфоне. Упакуйте товар в плотную упаковку.",
                    },
                    {
                      step: "3",
                      text: "Отнесите посылку в любой ближайший ПВЗ Ozon (адреса: ozon.ru/my/returns). Оператор примет посылку и выдаст чек.",
                    },
                    {
                      step: "4",
                      text: "После получения и проверки товара вернём деньги на ту же карту в течение 10 рабочих дней.",
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#3F1111] text-white text-[11px] flex items-center justify-center font-medium">
                        {item.step}
                      </span>
                      <p className="text-[13px] text-[#9a9a9a] leading-relaxed">{item.text}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Contact */}
            <div className="bg-[#F7F0EC] px-5 py-4 mb-8 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1">
                  Остались вопросы?
                </p>
                <p className="text-[13px] text-[#191E1B]">
                  Telegram:{" "}
                  <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className="text-[#3F1111] hover:underline">
                    @Andrua_famil
                  </a>{" "}
                  · Email:{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#3F1111] hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Link
                href={`${prefix}/catalog`}
                className="inline-block bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase px-8 py-3.5 hover:bg-[#5a1a1a] transition-colors"
              >
                Продолжить покупки
              </Link>
              <Link
                href={`${prefix}/`}
                className="text-[11px] tracking-[0.14em] uppercase text-[#9a9a9a] hover:text-[#191E1B] transition-colors"
              >
                На главную
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Main page ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[72px]">
        <div className="max-w-[720px] mx-auto px-6 md:px-8 py-14">

          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.28em] uppercase text-[#9a9a9a] mb-3">Сервис</p>
            <h1 className="font-prata text-[32px] md:text-[40px] text-[#191E1B] leading-tight mb-4">
              Возврат товара
            </h1>
            <p className="text-[14px] text-[#9a9a9a] leading-relaxed">
              Принимаем возвраты в течение 14 дней с момента получения заказа.
              Товар должен быть в исходном состоянии, с сохранённой упаковкой.
            </p>
          </div>

          {/* Conditions */}
          <div className="border border-[#e8e0da] px-6 py-5 mb-10">
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-3">
              Условия возврата
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Срок возврата: 14 дней с даты получения",
                "Оригинальная упаковка и ярлыки",
                "Без следов использования и повреждений",
                "Возврат денег в течение 10 рабочих дней",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2 text-[13px] text-[#9a9a9a]">
                  <span className="text-[#3F1111] mt-0.5">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Method selection */}
          <div className="mb-8">
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-4">
              Выберите способ возврата
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Direct */}
              <button
                type="button"
                onClick={() => setMethod("DIRECT")}
                className={`text-left border-2 p-5 transition-all ${
                  method === "DIRECT"
                    ? "border-[#3F1111] bg-white"
                    : "border-[#e8e0da] bg-white hover:border-[#191E1B]"
                }`}
              >
                <Package
                  size={22}
                  strokeWidth={1.5}
                  className={method === "DIRECT" ? "text-[#3F1111]" : "text-[#9a9a9a]"}
                />
                <p className="font-medium text-[15px] text-[#191E1B] mt-3 mb-1">
                  Прямая отправка
                </p>
                <p className="text-[12px] text-[#9a9a9a] leading-relaxed">
                  Отправьте посылку через Почту России, СДЭК или Boxberry на наш склад
                </p>
                <p className="text-[11px] text-[#9a9a9a] mt-3">
                  Стоимость доставки — за ваш счёт
                </p>
                {method === "DIRECT" && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-[#3F1111] font-medium tracking-[0.08em] uppercase">
                    <span>Выбрано</span> <ChevronRight size={12} />
                  </div>
                )}
              </button>

              {/* Ozon */}
              <button
                type="button"
                onClick={() => setMethod("OZON")}
                className={`text-left border-2 p-5 transition-all ${
                  method === "OZON"
                    ? "border-[#3F1111] bg-white"
                    : "border-[#e8e0da] bg-white hover:border-[#191E1B]"
                }`}
              >
                <MapPin
                  size={22}
                  strokeWidth={1.5}
                  className={method === "OZON" ? "text-[#3F1111]" : "text-[#9a9a9a]"}
                />
                <p className="font-medium text-[15px] text-[#191E1B] mt-3 mb-1">
                  Через ПВЗ Ozon
                </p>
                <p className="text-[12px] text-[#9a9a9a] leading-relaxed">
                  Мы пришлём ярлык возврата на email, вы сдадите посылку в ближайший ПВЗ Ozon
                </p>
                <p className="text-[11px] text-[#9a9a9a] mt-3">
                  Удобно · Более 8&nbsp;000 точек по России
                </p>
                {method === "OZON" && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-[#3F1111] font-medium tracking-[0.08em] uppercase">
                    <span>Выбрано</span> <ChevronRight size={12} />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Form */}
          {method && (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="Имя и фамилия"
                  name="name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  placeholder="Иван Иванов"
                  error={errors.name}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="ivan@example.com"
                  error={errors.email}
                />
              </div>

              <FormField
                label="Номер заказа"
                name="orderNumber"
                value={form.orderNumber}
                onChange={(v) => setForm({ ...form, orderNumber: v })}
                placeholder="AF-2026-0001"
                error={errors.orderNumber}
              />

              <div>
                <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">
                  Причина возврата
                </label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Опишите причину возврата: не подошёл размер, брак, не соответствует описанию..."
                  rows={4}
                  className={`w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors resize-none leading-relaxed ${
                    errors.reason ? "border-[#3F1111]" : "border-[#e8e0da] focus:border-[#191E1B]"
                  }`}
                />
                {errors.reason && (
                  <p className="mt-1 text-[11px] text-[#3F1111]">{errors.reason}</p>
                )}
                <p className="mt-1 text-[11px] text-[#9a9a9a] text-right">
                  {form.reason.length} символов
                </p>
              </div>

              {/* Method reminder */}
              <div className="bg-[#F7F0EC] border border-[#e8e0da] px-5 py-4">
                <p className="text-[11px] tracking-[0.14em] uppercase text-[#9a9a9a] mb-1">
                  Выбранный способ
                </p>
                <p className="text-[13px] text-[#191E1B]">
                  {method === "DIRECT"
                    ? "Прямая отправка — вы отправляете посылку самостоятельно"
                    : "Через ПВЗ Ozon — мы пришлём ярлык на ваш email в течение 24 часов"}
                </p>
                <button
                  type="button"
                  onClick={() => setMethod(null)}
                  className="mt-1 text-[11px] text-[#3F1111] hover:underline"
                >
                  Изменить способ
                </button>
              </div>

              {submitError && (
                <p className="text-[12px] text-[#3F1111] bg-[#F7F0EC] border border-[#3F1111]/20 px-4 py-3">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-4 hover:bg-[#5a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? "Отправляем..." : "Отправить заявку на возврат"}
              </button>

              <p className="text-center text-[11px] text-[#9a9a9a]">
                Или свяжитесь напрямую:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#3F1111] hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FormField({
  label, name, type = "text", placeholder, value, onChange, error,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors ${
          error ? "border-[#3F1111]" : "border-[#e8e0da] focus:border-[#191E1B]"
        }`}
      />
      {error && <p className="mt-1 text-[11px] text-[#3F1111]">{error}</p>}
    </div>
  );
}
