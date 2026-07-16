import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import RetryPayment from "@/components/shop/RetryPayment";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ num?: string; fail?: string }>;
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { num, fail } = await searchParams;
  void locale;
  const orderNumber = num ?? "AF-????";

  // Читаем актуальный статус заказа (оплата подтверждается webhook'ом Т-Банка)
  let status: string | null = null;
  if (num) {
    const order = await prisma.order.findFirst({
      where: { number: num },
      select: { status: true },
    });
    status = order?.status ?? null;
  }
  const isPaid = status === "PAID";
  // Оплата не прошла: Т-Банк вернул на fail-URL, либо заказ отменён
  const isFailed = !isPaid && (fail === "1" || status === "CANCELLED");
  // Иначе — оплата ещё подтверждается (PENDING)

  const heading = isPaid
    ? "Оплата прошла!"
    : isFailed
    ? "Оплата не прошла"
    : "Проверяем оплату…";
  const lead = isPaid
    ? "Спасибо за заказ! Оплата получена, заказ передан в обработку."
    : isFailed
    ? "Платёж не был завершён — например, недостаточно средств, отклонение банком или отмена. Деньги не списаны. Ваш заказ сохранён — попробуйте оплатить ещё раз."
    : "Заказ создан. Подтверждаем оплату — обычно это занимает несколько секунд. Обновите страницу через минуту.";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-[72px] px-6">
        <div className="w-full max-w-md text-center py-16">
          {/* Icon: галочка (оплачено) или крест (не прошло) */}
          <div className="mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: isFailed ? "#fee2e2" : "#F7F0EC" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="17" stroke={isFailed ? "#dc2626" : "#3F1111"} strokeWidth="1.5" />
              {isFailed ? (
                <path d="M12 12L24 24M24 12L12 24" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M10.5 18L15.5 23L25.5 13" stroke="#3F1111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          {/* Heading */}
          <h1 className="font-prata text-[32px] md:text-[40px] text-[#191E1B] mb-3 leading-tight">
            {heading}
          </h1>

          {/* Order number */}
          <div className="inline-block bg-[#F7F0EC] px-6 py-3 mb-5">
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#9a9a9a] mb-1">
              Номер заказа
            </p>
            <p className="font-prata text-[22px] text-[#3F1111] tracking-wider">
              {orderNumber}
            </p>
          </div>

          {/* Status text */}
          <p className="text-[14px] text-[#9a9a9a] mb-2 leading-relaxed">
            {lead}
          </p>
          {!isFailed && (
            <p className="text-[13px] text-[#9a9a9a] mb-10 leading-relaxed">
              Детали заказа отправлены на ваш email. Мы уведомим, когда заказ передадут в доставку.
            </p>
          )}
          {isFailed && <div className="mb-8" />}

          {/* Actions */}
          <div className="flex flex-col items-center gap-4">
            {isFailed ? (
              <>
                <RetryPayment orderNumber={orderNumber} />
                <Link
                  href="/catalog"
                  className="text-[11px] tracking-[0.14em] uppercase text-[#9a9a9a] hover:text-[#191E1B] transition-colors mt-1"
                >
                  Вернуться в каталог
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/catalog"
                  className="w-full max-w-xs block bg-[#3F1111] text-white text-[12px] tracking-[0.18em] uppercase py-3.5 hover:bg-[#5a1a1a] transition-colors text-center"
                >
                  Продолжить покупки
                </Link>
                <Link
                  href="/"
                  className="text-[11px] tracking-[0.14em] uppercase text-[#9a9a9a] hover:text-[#191E1B] transition-colors mt-1"
                >
                  На главную
                </Link>
              </>
            )}
          </div>

          {/* Decorative line */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-[#e8e0da]" />
            <span className="font-prata text-[12px] text-[#9a9a9a] tracking-wider">Андруа Фамиль</span>
            <div className="h-px w-16 bg-[#e8e0da]" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
