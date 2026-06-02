import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "@/lib/integrations";
import { createYooKassaPayment, type ReceiptItem } from "@/lib/yookassa";

/**
 * POST /api/payments/create   { orderId }
 *
 * Создаёт платёж ЮKassa для существующего заказа и возвращает ссылку на оплату.
 *
 * БЕЗОПАСНОСТЬ:
 *  • Сумма берётся ИЗ БАЗЫ (order.total), а не из тела запроса — клиент не может
 *    подменить сумму.
 *  • Платёж создаётся только для заказа в статусе PENDING.
 *  • Idempotence-Key = order.id: повторный вызов не создаёт второй платёж.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId: string | undefined = body.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "orderId обязателен" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    // Уже оплачен — не создаём повторно
    if (order.status === "PAID") {
      return NextResponse.json({ error: "Заказ уже оплачен" }, { status: 409 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Оплата недоступна для этого статуса заказа" },
        { status: 409 }
      );
    }

    if (!order.total || order.total <= 0) {
      return NextResponse.json({ error: "Некорректная сумма заказа" }, { status: 400 });
    }

    // return_url — куда вернуть покупателя после оплаты
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      request.nextUrl.origin;
    const returnUrl = `${siteUrl}/order/success?num=${encodeURIComponent(order.number)}`;

    // Чек 54-ФЗ — только если включена фискализация в админке
    const fiscalization = await getIntegration("yookassa_fiscalization");
    let receipt: { email?: string; phone?: string; items: ReceiptItem[] } | undefined;

    if (fiscalization === "1" || fiscalization === "true") {
      const vatCodeRaw = await getIntegration("yookassa_vat_code");
      const vatCode = Number(vatCodeRaw) || 1; // по умолчанию «без НДС» (ИП на УСН)

      // Чек строим из позиций заказа (суммы из БД)
      const items: ReceiptItem[] = order.items.map(
        (it: { name: string; qty: number; price: number }) => ({
          description: it.name,
          quantity: it.qty,
          amountRub: it.price,
          vatCode,
        })
      );

      // Если была скидка — добавляем строку-корректировку, чтобы сумма чека = order.total
      // (ЮKassa требует, чтобы сумма позиций совпадала с amount платежа)
      const itemsTotal = items.reduce((s, it) => s + it.amountRub * it.quantity, 0);
      const diff = Math.round((order.total - itemsTotal) * 100) / 100;
      if (diff !== 0) {
        items.push({
          description: diff < 0 ? "Скидка по промокоду" : "Доставка",
          quantity: 1,
          amountRub: diff,
          vatCode,
        });
      }

      receipt = {
        email: order.customerEmail || undefined,
        phone: order.customerPhone || undefined,
        items,
      };
    }

    const payment = await createYooKassaPayment({
      amountRub: order.total,
      description: `Заказ ${order.number}`,
      orderId: order.id,
      orderNumber: order.number,
      returnUrl,
      idempotenceKey: order.id, // защита от двойного платежа
      receipt,
    });

    // Сохраняем ID платежа для последующей сверки (webhook / success page)
    await prisma.order.update({
      where: { id: order.id },
      data: { kassaPaymentId: payment.id },
    });

    return NextResponse.json({ ok: true, confirmationUrl: payment.confirmationUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Не удалось создать платёж";
    console.error("POST /api/payments/create error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
