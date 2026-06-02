"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, Tag, X, ChevronRight, Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PvzSearch = dynamic(() => import("@/components/shop/PvzSearch"), { ssr: false });

type Step = 1 | 2 | 3;
type DeliveryType = "ozon-pvz" | "ozon-courier";

interface FormData {
  name: string;
  phone: string;
  email: string;
  deliveryType: DeliveryType;
  address: string;
  pvzAddress: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  pvzAddress?: string;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
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
          error
            ? "border-[#3F1111]"
            : "border-[#e8e0da] focus:border-[#191E1B]"
        }`}
      />
      {error && <p className="mt-1 text-[11px] text-[#3F1111]">{error}</p>}
    </div>
  );
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQty,
    clearCart,
    promoCode,
    discount,
    applyPromo,
    removePromo,
    subtotal,
    total,
  } = useCartStore();

  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    deliveryType: "ozon-pvz",
    address: "",
    pvzAddress: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const sub = subtotal();
  const tot = total();
  const discountAmount = sub - tot;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        applyPromo(promoInput.trim().toUpperCase(), data.discountPercent);
        setPromoInput("");
      } else {
        setPromoError(data.message ?? data.error ?? "Промокод не найден");
      }
    } catch {
      setPromoError("Ошибка проверки промокода");
    } finally {
      setPromoLoading(false);
    }
  };

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = "Введите имя (минимум 2 символа)";
    }
    const phoneClean = form.phone.replace(/\D/g, "");
    if (phoneClean.length < 10) {
      errs.phone = "Введите корректный номер телефона";
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) {
      errs.email = "Введите корректный email";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    if (form.deliveryType === "ozon-courier" && !form.address.trim()) {
      errs.address = "Введите адрес доставки";
    }
    if (form.deliveryType === "ozon-pvz" && !form.pvzAddress.trim()) {
      errs.pvzAddress = "Введите адрес пункта выдачи";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleOrder = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            phone: form.phone,
            email: form.email,
          },
          delivery: {
            type: form.deliveryType,
            address: form.deliveryType === "ozon-courier" ? form.address : undefined,
          },
          pvzAddress: form.deliveryType === "ozon-pvz" ? form.pvzAddress : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            qty: i.qty,
            size: i.size,
            color: i.color,
          })),
          promoCode,
          discount,
          subtotal: sub,
          total: tot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.orderId) {
        setSubmitError(data.error ?? "Ошибка при оформлении заказа. Попробуйте ещё раз.");
        setSubmitting(false);
        return;
      }

      // Заказ создан — создаём платёж ЮKassa и уходим на страницу оплаты
      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId }),
      });
      const payData = await payRes.json();

      if (payRes.ok && payData.confirmationUrl) {
        clearCart();
        // редирект на защищённую страницу оплаты ЮKassa
        window.location.href = payData.confirmationUrl;
      } else {
        // Заказ создан, но оплату инициировать не удалось — не теряем заказ
        clearCart();
        setSubmitError(
          (payData.error ?? "Не удалось перейти к оплате.") +
            ` Ваш заказ ${data.orderNumber} сохранён — мы свяжемся с вами для оплаты.`
        );
        setSubmitting(false);
      }
    } catch {
      setSubmitError("Ошибка соединения. Проверьте интернет и попробуйте снова.");
      setSubmitting(false);
    } finally {
      // setSubmitting управляется выше по веткам (редирект не должен снимать лоадер)
    }
  };

  if (items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className="pt-[72px] flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <div className="w-20 h-20 rounded-full bg-[#F7F0EC] flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="1.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h1 className="font-prata text-[28px] text-[#191E1B] mb-3">Корзина пуста</h1>
          <p className="text-[14px] text-[#9a9a9a] mb-8">
            Добавьте товары из каталога, чтобы оформить заказ
          </p>
          <Link
            href="/catalog"
            className="bg-[#3F1111] text-white text-[11px] tracking-[0.18em] uppercase px-8 py-3.5 hover:bg-[#5a1a1a] transition-colors"
          >
            Перейти в каталог
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="pt-[72px]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-10">
          <h1 className="font-prata text-[32px] text-[#191E1B] mb-8">Оформление заказа</h1>

          {/* Steps indicator */}
          <div className="flex items-center gap-0 mb-10">
            {([1, 2, 3] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors ${
                      s < step
                        ? "bg-[#3F1111] text-white"
                        : s === step
                        ? "bg-[#191E1B] text-white"
                        : "bg-[#e8e0da] text-[#9a9a9a]"
                    }`}
                  >
                    {s < step ? <Check size={12} /> : s}
                  </div>
                  <span
                    className={`text-[11px] tracking-[0.12em] uppercase hidden sm:block ${
                      s === step ? "text-[#191E1B]" : "text-[#9a9a9a]"
                    }`}
                  >
                    {s === 1 ? "Контакты" : s === 2 ? "Доставка" : "Оплата"}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`w-12 sm:w-20 h-px mx-3 ${s < step ? "bg-[#3F1111]" : "bg-[#e8e0da]"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-[1fr_340px] gap-10 items-start">
            {/* Left: Form steps */}
            <div>
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-prata text-[20px] text-[#191E1B] mb-6">Контактные данные</h2>

                  {/* Cart items (editable) */}
                  <div className="border border-[#e8e0da] divide-y divide-[#e8e0da] mb-8">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4">
                        <div className="w-16 h-20 flex-shrink-0 bg-[#F7F0EC] overflow-hidden">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-prata text-[14px] leading-snug mb-1 line-clamp-2">{item.name}</p>
                          {(item.size || item.color) && (
                            <p className="text-[11px] text-[#9a9a9a] mb-2">
                              {[item.size && `${item.size}`, item.color && `${item.color}`].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-[#e8e0da]">
                              <button
                                onClick={() => updateQty(item.id, item.qty - 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#9a9a9a] hover:text-[#191E1B] transition-colors"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-7 text-center text-[13px]">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.id, item.qty + 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#9a9a9a] hover:text-[#191E1B] transition-colors"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[13px] font-medium">
                                {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                              </span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-[#9a9a9a] hover:text-[#3F1111] transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Field
                    label="Имя и фамилия"
                    name="name"
                    value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })}
                    placeholder="Иван Иванов"
                    error={errors.name}
                  />
                  <Field
                    label="Телефон"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                    placeholder="+7 (999) 000-00-00"
                    error={errors.phone}
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    placeholder="ivan@example.com"
                    error={errors.email}
                  />

                  <button
                    onClick={handleNextStep}
                    className="w-full bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-3.5 hover:bg-[#5a1a1a] transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    Далее — Доставка
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="font-prata text-[20px] text-[#191E1B] mb-6">Способ доставки</h2>

                  <div className="space-y-3">
                    {(
                      [
                        { value: "ozon-pvz", label: "Ozon ПВЗ", desc: "Самовывоз из пункта выдачи Ozon" },
                        { value: "ozon-courier", label: "Ozon Курьер", desc: "Курьерская доставка до двери" },
                      ] as { value: DeliveryType; label: string; desc: string }[]
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-4 p-4 border cursor-pointer transition-colors ${
                          form.deliveryType === opt.value
                            ? "border-[#3F1111] bg-[#F7F0EC]"
                            : "border-[#e8e0da] hover:border-[#9a9a9a]"
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              form.deliveryType === opt.value ? "border-[#3F1111]" : "border-[#e8e0da]"
                            }`}
                          >
                            {form.deliveryType === opt.value && (
                              <div className="w-2 h-2 rounded-full bg-[#3F1111]" />
                            )}
                          </div>
                        </div>
                        <div>
                          <input
                            type="radio"
                            className="sr-only"
                            value={opt.value}
                            checked={form.deliveryType === opt.value}
                            onChange={() => setForm({ ...form, deliveryType: opt.value, address: "", pvzAddress: "" })}
                          />
                          <p className="text-[14px] font-medium text-[#191E1B]">{opt.label}</p>
                          <p className="text-[12px] text-[#9a9a9a] mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {form.deliveryType === "ozon-pvz" ? (
                    <PvzSearch
                      value={form.pvzAddress}
                      onChange={(v) => setForm((f) => ({ ...f, pvzAddress: v }))}
                      error={errors.pvzAddress}
                    />
                  ) : (
                    <div>
                      <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">
                        Адрес доставки
                      </label>
                      <textarea
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Город, улица, дом, квартира"
                        rows={3}
                        className={`w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors resize-none ${
                          errors.address ? "border-[#3F1111]" : "border-[#e8e0da] focus:border-[#191E1B]"
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-[11px] text-[#3F1111]">{errors.address}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 border border-[#e8e0da] text-[12px] tracking-[0.14em] uppercase py-3.5 text-[#9a9a9a] hover:border-[#191E1B] hover:text-[#191E1B] transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-[2] bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-3.5 hover:bg-[#5a1a1a] transition-colors flex items-center justify-center gap-2"
                    >
                      Далее — Оплата
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="font-prata text-[20px] text-[#191E1B] mb-6">Подтверждение заказа</h2>

                  {/* Online payment info */}
                  <div className="border border-[#e8e0da] p-6 bg-[#F7F0EC] space-y-4">
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a]">Оплата</p>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-[#3F1111] flex items-center justify-center mt-0.5 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#3F1111]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[#191E1B] mb-1">Онлайн-оплата картой или СБП</p>
                        <p className="text-[12px] text-[#9a9a9a] leading-relaxed">
                          После нажатия кнопки вы перейдёте на защищённую страницу оплаты ЮKassa.
                          После оплаты заказ автоматически уйдёт в обработку.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-[#e8e0da] pt-4 space-y-2">
                      {[
                        "Банковские карты Visa / MasterCard / МИР",
                        "СБП — Система быстрых платежей",
                        "SberPay, безопасная сделка",
                      ].map((method) => (
                        <div key={method} className="flex items-center gap-2 text-[12px] text-[#9a9a9a]">
                          <span className="text-[#3F1111]">✓</span>
                          {method}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery info recap */}
                  <div className="border border-[#e8e0da] p-5 space-y-2 text-[13px]">
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-3">Доставка</p>
                    <div className="flex justify-between">
                      <span className="text-[#9a9a9a]">Способ</span>
                      <span className="text-[#191E1B]">
                        {form.deliveryType === "ozon-pvz" ? "Ozon ПВЗ" : "Ozon Курьер"}
                      </span>
                    </div>
                    {form.deliveryType === "ozon-pvz" && form.pvzAddress && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#9a9a9a] flex-shrink-0">Пункт выдачи</span>
                        <span className="text-[#191E1B] text-right text-[12px]">{form.pvzAddress}</span>
                      </div>
                    )}
                    {form.deliveryType === "ozon-courier" && form.address && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#9a9a9a] flex-shrink-0">Адрес</span>
                        <span className="text-[#191E1B] text-right text-[12px]">{form.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-[#e8e0da]">
                      <span className="text-[#9a9a9a]">Стоимость доставки</span>
                      <span className="text-[#191E1B] font-medium">Бесплатно</span>
                    </div>
                  </div>

                  {/* Order summary recap */}
                  <div className="border border-[#e8e0da] p-5 space-y-2">
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a] mb-3">Ваш заказ</p>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-[13px]">
                        <span className="text-[#9a9a9a] line-clamp-1 flex-1 mr-4">
                          {item.name} × {item.qty}
                        </span>
                        <span className="text-[#191E1B] flex-shrink-0">
                          {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[#e8e0da]">
                      <div className="flex justify-between text-[14px] font-medium text-[#191E1B]">
                        <span>К оплате</span>
                        <span>{tot.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <p className="text-[12px] text-[#3F1111] bg-[#F7F0EC] border border-[#3F1111]/20 px-4 py-3">
                      {submitError}
                    </p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 border border-[#e8e0da] text-[12px] tracking-[0.14em] uppercase py-3.5 text-[#9a9a9a] hover:border-[#191E1B] hover:text-[#191E1B] transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleOrder}
                      disabled={submitting}
                      className="flex-[2] bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-3.5 hover:bg-[#5a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Переходим к оплате..." : `Перейти к оплате · ${tot.toLocaleString("ru-RU")} ₽`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order summary */}
            <div className="bg-[#F7F0EC] p-6 space-y-5 sticky top-24">
              <h3 className="font-prata text-[18px] text-[#191E1B]">Сумма заказа</h3>

              {/* Promo code */}
              {promoCode ? (
                <div className="flex items-center justify-between bg-white px-3 py-2.5 border border-[#e8e0da]">
                  <div className="flex items-center gap-2 text-[12px] text-[#3F1111]">
                    <Tag size={13} strokeWidth={1.5} />
                    <span className="font-medium">{promoCode}</span>
                    <span className="text-[#9a9a9a]">−{discount}%</span>
                  </div>
                  <button
                    onClick={removePromo}
                    className="text-[#9a9a9a] hover:text-[#3F1111] transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Промокод"
                      className="flex-1 border border-[#e8e0da] px-3 py-2 text-[12px] uppercase tracking-[0.08em] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9a9a9a] bg-white outline-none focus:border-[#3F1111] transition-colors"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-3 py-2 bg-[#191E1B] text-white text-[10px] tracking-[0.14em] uppercase hover:bg-[#3F1111] transition-colors disabled:opacity-40"
                    >
                      {promoLoading ? "…" : "OK"}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-[#3F1111]">{promoError}</p>
                  )}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between text-[#9a9a9a]">
                  <span>Товары ({items.reduce((s, i) => s + i.qty, 0)} шт.)</span>
                  <span>{sub.toLocaleString("ru-RU")} ₽</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#3F1111]">
                    <span>Скидка {discount}%</span>
                    <span>−{discountAmount.toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
                <div className="flex justify-between text-[#9a9a9a]">
                  <span>Доставка</span>
                  <span className="text-[#191E1B]">бесплатно</span>
                </div>
                <div className="flex justify-between font-medium text-[16px] text-[#191E1B] pt-3 border-t border-[#e8e0da]">
                  <span>Итого</span>
                  <span>{tot.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>

              <p className="text-[11px] text-[#9a9a9a] leading-relaxed">
                Нажимая «Оплатить», вы соглашаетесь с{" "}
                <Link href="/" className="underline hover:text-[#191E1B] transition-colors">
                  условиями оферты
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
