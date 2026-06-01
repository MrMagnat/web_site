"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { CheckCircle, MapPin, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
  email: string;
}

const SUPPORT_EMAIL = "support@andrua-famil.ru";

export default function ReturnPage() {
  const locale = useLocale();
  const prefix = locale === "ru" ? "" : "/en";

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
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, returnMethod: "OZON" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitted({ returnNumber: data.returnNumber, email: form.email });
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
              <p className="text-[14px] text-[#9a9a9a] leading-relaxed">
                Мы свяжемся с вами по адресу{" "}
                <span className="text-[#191E1B] font-medium">{submitted.email}</span>{" "}
                в течение 24 часов и пришлём инструкцию по возврату.
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
                Укажите номер<br />при переписке
              </p>
            </div>

            {/* Steps */}
            <div className="border border-[#e8e0da] px-6 py-6 mb-8">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#9a9a9a] mb-4">
                Что будет дальше
              </p>
              <ol className="space-y-4">
                {[
                  "Мы проверим заявку и вышлем на ваш email ярлык для возврата через Ozon.",
                  "Упакуйте товар в исходную или плотную упаковку, приложите все комплектующие.",
                  "Принесите посылку в любой пункт выдачи Ozon — покажите ярлык или QR-код на экране. Оператор всё оформит.",
                  "После получения и проверки товара на складе Ozon вернём деньги тем же способом, которым был оплачен заказ — в течение 10 рабочих дней.",
                ].map((text, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#3F1111] text-white text-[11px] flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <p className="text-[13px] text-[#9a9a9a] leading-relaxed">{text}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Find PVZ */}
            <div className="bg-[#F7F0EC] px-5 py-4 mb-8 flex items-start gap-3">
              <MapPin size={16} className="text-[#3F1111] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-medium text-[#191E1B] mb-0.5">Найти ближайший ПВЗ Ozon</p>
                <a href="https://www.ozon.ru/my/returns" target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-[#3F1111] hover:underline">
                  ozon.ru/my/returns →
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Link href={`${prefix}/catalog`}
                className="inline-block bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase px-8 py-3.5 hover:bg-[#5a1a1a] transition-colors">
                Продолжить покупки
              </Link>
              <Link href={`${prefix}/`}
                className="text-[11px] tracking-[0.14em] uppercase text-[#9a9a9a] hover:text-[#191E1B] transition-colors">
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
              Принимаем возвраты в течение{" "}
              <strong className="text-[#191E1B]">30 дней</strong> с момента получения заказа
              через любой пункт выдачи Ozon — это бесплатно для вас.
            </p>
          </div>

          {/* Conditions grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { title: "30 дней", desc: "Срок возврата с даты получения" },
              { title: "Бесплатно", desc: "Возврат через ПВЗ Ozon за наш счёт" },
              { title: "8 000+", desc: "Пунктов выдачи по всей России" },
              { title: "10 дней", desc: "Срок возврата денег после проверки" },
            ].map((c) => (
              <div key={c.title} className="border border-[#e8e0da] px-4 py-4 bg-white text-center">
                <p className="font-prata text-[20px] text-[#3F1111] mb-1">{c.title}</p>
                <p className="text-[11px] text-[#9a9a9a] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="mb-10">
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-4">Как проходит возврат</p>
            <div className="space-y-3">
              {[
                { title: "Оставьте заявку", desc: "Заполните форму ниже — укажите номер заказа и причину возврата." },
                { title: "Получите ярлык", desc: "В течение 24 часов мы пришлём на email ярлык возврата с QR-кодом. Печатать не нужно — достаточно показать с экрана смартфона." },
                { title: "Сдайте в ПВЗ Ozon", desc: "Упакуйте товар и принесите в любой ближайший пункт выдачи Ozon. Оператор примет посылку и выдаст чек." },
                { title: "Получите деньги", desc: "После проверки товара на складе вернём деньги в течение 10 рабочих дней тем же способом оплаты." },
              ].map((item, i) => (
                <div key={item.title} className="flex gap-4 border border-[#e8e0da] px-5 py-4 bg-white">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3F1111] text-white text-[12px] flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-[#191E1B] mb-0.5">{item.title}</p>
                    <p className="text-[12px] text-[#9a9a9a] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="border border-[#e8e0da] px-6 py-5 mb-6 bg-white">
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-3">
              Условия возврата (согласно правилам Ozon)
            </p>
            <ul className="space-y-2">
              {[
                "Товар не использовался, сохранены фабричные ярлыки и бирки",
                "Сохранена оригинальная упаковка и товарный вид",
                "Комплектность соответствует заказу (все части, инструкции, документы)",
                "При обнаружении брака — возврат принимается в течение гарантийного срока",
                "Срок возврата — 30 дней с даты получения заказа",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2 text-[13px] text-[#9a9a9a]">
                  <span className="text-[#3F1111] mt-0.5 flex-shrink-0">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Warning */}
          <div className="flex gap-3 bg-[#FFF8F0] border border-[#f59e0b]/30 px-5 py-4 mb-10">
            <AlertCircle size={15} className="text-[#d97706] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#9a9a9a] leading-relaxed">
              <span className="font-medium text-[#191E1B]">Не подлежат возврату</span>{" "}
              товары надлежащего качества из перечня Постановления Правительства РФ №2463:
              нижнее бельё, чулочно-носочные изделия, купальники и другие предметы гигиены.
            </p>
          </div>

          {/* Form */}
          <div>
            <p className="font-prata text-[22px] text-[#191E1B] mb-6">Оформить заявку на возврат</p>
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label="Имя и фамилия" name="name" value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })} placeholder="Иван Иванов" error={errors.name} />
                <FormField label="Email" name="email" type="email" value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })} placeholder="ivan@example.com" error={errors.email} />
              </div>
              <FormField label="Номер заказа" name="orderNumber" value={form.orderNumber}
                onChange={(v) => setForm({ ...form, orderNumber: v })} placeholder="AF-2026-0001" error={errors.orderNumber} />
              <div>
                <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">
                  Причина возврата
                </label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Опишите причину: не подошёл размер, брак, не соответствует описанию..."
                  rows={4}
                  className={`w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors resize-none leading-relaxed ${
                    errors.reason ? "border-[#3F1111]" : "border-[#e8e0da] focus:border-[#191E1B]"
                  }`}
                />
                {errors.reason && <p className="mt-1 text-[11px] text-[#3F1111]">{errors.reason}</p>}
              </div>

              {submitError && (
                <p className="text-[12px] text-[#3F1111] bg-[#F7F0EC] border border-[#3F1111]/20 px-4 py-3">
                  {submitError}
                </p>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-4 hover:bg-[#5a1a1a] transition-colors disabled:opacity-50">
                {submitting ? "Отправляем..." : "Отправить заявку на возврат"}
              </button>

              <p className="text-center text-[11px] text-[#9a9a9a]">
                Вопросы по возврату:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#3F1111] hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FormField({ label, name, type = "text", placeholder, value, onChange, error }: {
  label: string; name: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">{label}</label>
      <input type={type} name={name} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors ${
          error ? "border-[#3F1111]" : "border-[#e8e0da] focus:border-[#191E1B]"
        }`}
      />
      {error && <p className="mt-1 text-[11px] text-[#3F1111]">{error}</p>}
    </div>
  );
}
