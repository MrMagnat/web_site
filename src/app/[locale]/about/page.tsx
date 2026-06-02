"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const VALUES = [
  {
    icon: "✦",
    title: "Качество без компромиссов",
    text: "Каждое изделие проходит многоступенчатый контроль качества. Мы используем только сертифицированные материалы, которые не теряют форму и цвет после сотен стирок.",
  },
  {
    icon: "✦",
    title: "Эстетика в деталях",
    text: "Наши дизайнеры вдохновляются природными фактурами, нейтральными палитрами и скандинавской простотой. Каждый товар вписывается в любой интерьер.",
  },
  {
    icon: "✦",
    title: "Честная цена",
    text: "Мы работаем напрямую с производителями, убирая лишние наценки. Качество уровня бутика — по доступной цене.",
  },
  {
    icon: "✦",
    title: "Забота о покупателе",
    text: "Поддержка работает 7 дней в неделю. Отвечаем в Telegram в течение часа. Возврат без лишних вопросов в течение 14 дней.",
  },
];

const STATS = [
  { value: "×10", label: "Рост продаж за год" },
  { value: "300+", label: "Товаров в каталоге" },
  { value: "85+", label: "Регионов России" },
  { value: "14 дней", label: "Политика возврата" },
];

export default function AboutPage() {
  const locale = useLocale();
  const prefix = locale === "ru" ? "" : "/en";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[72px]">

        {/* Hero */}
        <section className="relative bg-[#191E1B] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-24 md:py-36 relative">
            <p className="text-[10px] tracking-[0.32em] uppercase text-white/40 mb-6">
              О бренде
            </p>
            <h1 className="font-prata text-[30px] sm:text-[40px] md:text-[58px] leading-[1.1] mb-8 max-w-[720px]">
              Мы создаём уют&nbsp;—<br />
              не&nbsp;просто продаём текстиль
            </h1>
            <p className="text-[16px] text-white/60 leading-relaxed max-w-[520px]">
              Андруа Фамиль — российский бренд домашнего текстиля. Основан с&nbsp;одной идеей:
              сделать дом красивым и&nbsp;уютным для каждого, без переплат.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-[#e8e0da]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {STATS.map((s, i) => (
                <div
                  key={i}
                  className={`py-10 px-4 sm:px-6 text-center border-[#e8e0da] ${
                    i % 2 === 0 ? "border-r" : "md:border-r"
                  } ${i === 3 ? "md:border-r-0" : ""} ${i < 2 ? "border-b md:border-b-0" : ""}`}
                >
                  <p className="font-prata text-[30px] sm:text-[36px] md:text-[42px] text-[#3F1111] mb-2">
                    {s.value}
                  </p>
                  <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9a9a]">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="max-w-[1200px] mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <p className="text-[10px] tracking-[0.28em] uppercase text-[#9a9a9a] mb-5">
                Наша история
              </p>
              <h2 className="font-prata text-[30px] md:text-[38px] text-[#191E1B] leading-tight mb-6">
                С маленькой мастерской до федерального бренда
              </h2>
              <div className="space-y-4 text-[15px] text-[#9a9a9a] leading-relaxed">
                <p>
                  Мы начинали как небольшой проект с минимальным ассортиментом и&nbsp;большой
                  мечтой: доказать, что красивый текстиль для дома не&nbsp;должен стоить дорого.
                </p>
                <p>
                  За&nbsp;год продажи выросли более чем в&nbsp;10 раз. Сегодня мы&nbsp;покрываем
                  практически все регионы России, а&nbsp;также Беларусь, Армению и&nbsp;Казахстан.
                </p>
                <p>
                  Каждый сезон мы&nbsp;выпускаем новые коллекции, вдохновлённые природными
                  палитрами и&nbsp;современными интерьерными трендами. Ковры, постельное бельё,
                  полотенца, декор&nbsp;— всё, что делает дом домом.
                </p>
              </div>
            </div>

            {/* Visual block */}
            <div className="relative">
              <div className="aspect-[4/5] bg-[#F7F0EC] relative overflow-hidden">
                <div className="absolute inset-8 border border-[#e8e0da]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-prata text-[64px] text-[#3F1111]/15 leading-none select-none">
                      AF
                    </p>
                    <p className="text-[11px] tracking-[0.28em] uppercase text-[#9a9a9a] mt-4">
                      Андруа Фамиль
                    </p>
                  </div>
                </div>
              </div>
              {/* Accent card */}
              <div className="absolute -bottom-6 left-0 sm:-left-6 bg-[#191E1B] text-white px-7 py-5">
                <p className="font-prata text-[22px]">2024</p>
                <p className="text-[11px] tracking-[0.16em] uppercase text-white/50 mt-0.5">
                  Год основания
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[#F7F0EC] py-20 md:py-28">
          <div className="max-w-[1200px] mx-auto px-6 md:px-8">
            <p className="text-[10px] tracking-[0.28em] uppercase text-[#9a9a9a] mb-4 text-center">
              Принципы
            </p>
            <h2 className="font-prata text-[30px] md:text-[38px] text-[#191E1B] text-center mb-14">
              Наши ценности
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {VALUES.map((v, i) => (
                <div key={i} className="bg-white p-7">
                  <span className="text-[#3F1111] text-[20px] mb-4 block">{v.icon}</span>
                  <h3 className="font-prata text-[18px] text-[#191E1B] mb-3 leading-tight">
                    {v.title}
                  </h3>
                  <p className="text-[13px] text-[#9a9a9a] leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quality */}
        <section className="max-w-[1200px] mx-auto px-6 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <p className="text-[10px] tracking-[0.28em] uppercase text-[#9a9a9a] mb-5">
                Материалы
              </p>
              <h2 className="font-prata text-[30px] md:text-[36px] text-[#191E1B] leading-tight mb-6">
                Качество, которое вы чувствуете
              </h2>
              <div className="space-y-4 text-[15px] text-[#9a9a9a] leading-relaxed">
                <p>
                  Мы тщательно отбираем поставщиков и&nbsp;материалы. Весь текстиль соответствует
                  российским стандартам качества и&nbsp;безопасности.
                </p>
                <p>
                  Хлопок, лён, микрофибра&nbsp;— каждый материал подобран для конкретного
                  применения. Постельное бельё из&nbsp;премиального хлопка мягкое с&nbsp;первого
                  использования, полотенца быстро сохнут и&nbsp;остаются пушистыми,
                  ковры сохраняют форму годами.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Хлопок", desc: "100% натуральный, гипоаллергенный" },
                { label: "Лён", desc: "Экологичный, долговечный" },
                { label: "Микрофибра", desc: "Быстросохнущая, мягкая" },
                { label: "Поликоттон", desc: "Прочный, не мнётся" },
              ].map((m) => (
                <div key={m.label} className="border border-[#e8e0da] p-5">
                  <p className="font-prata text-[17px] text-[#191E1B] mb-1">{m.label}</p>
                  <p className="text-[12px] text-[#9a9a9a] leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Delivery & support strip */}
        <section className="bg-[#191E1B] py-14">
          <div className="max-w-[1200px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-white">
              <div>
                <p className="text-[11px] tracking-[0.22em] uppercase text-white/35 mb-3">
                  Доставка
                </p>
                <p className="text-[15px] text-white/80 leading-relaxed">
                  По всей России через Ozon Логистику. Курьер или ближайший ПВЗ.
                  Бесплатно от&nbsp;3&nbsp;000&nbsp;₽.
                </p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.22em] uppercase text-white/35 mb-3">
                  Возврат
                </p>
                <p className="text-[15px] text-white/80 leading-relaxed">
                  14 дней без вопросов. Прямая отправка или через ПВЗ Ozon —
                  на&nbsp;ваш выбор.
                </p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.22em] uppercase text-white/35 mb-3">
                  Поддержка
                </p>
                <p className="text-[15px] text-white/80 leading-relaxed">
                  7 дней в неделю. Ответим в Telegram в&nbsp;течение часа.{" "}
                  <a
                    href="https://t.me/Andrua_famil"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-white/60 hover:text-white transition-colors"
                  >
                    @Andrua_famil
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 text-center">
          <p className="font-prata text-[28px] md:text-[36px] text-[#191E1B] mb-6">
            Готовы обновить дом?
          </p>
          <Link
            href={`${prefix}/catalog`}
            className="inline-block bg-[#3F1111] text-white text-[12px] tracking-[0.2em] uppercase px-10 py-4 hover:bg-[#5a1a1a] transition-colors"
          >
            Смотреть каталог
          </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
