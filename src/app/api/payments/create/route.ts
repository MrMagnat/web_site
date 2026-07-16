import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTBankPayment } from "@/lib/tbank";

/**
 * POST /api/payments/create   { orderId }
 *
 * Создаёт платёж Т-Банка для заказа и возвращает ссылку на оплату.
 *
 * БЕЗОПАСНОСТЬ:
 *  • Сумма берётся ИЗ БАЗЫ (order.total), а не из тела запроса.
 *  • Платёж создаётся только для заказа в статусе PENDING.
 *  • OrderId = order.id (по нему webhook находит заказ).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId: string | undefined = body.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "orderId обязателен" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }
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

    // Домен берём из самого запроса (на каком домене покупатель — туда и
    // вернём после оплаты). Так return-ссылки всегда совпадают с реальным
    // доменом и не зависят от возможно устаревшего NEXT_PUBLIC_SITE_URL.
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const siteUrl = host
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || request.nextUrl.origin);

    const payment = await createTBankPayment({
      amountRub: order.total,
      orderId: order.id,
      description: `Заказ ${order.number}`,
      successUrl: `${siteUrl}/order/success?num=${encodeURIComponent(order.number)}`,
      failUrl: `${siteUrl}/order/success?num=${encodeURIComponent(order.number)}&fail=1`,
      notificationUrl: `${siteUrl}/api/webhooks/tbank`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { kassaPaymentId: payment.paymentId },
    });

    return NextResponse.json({ ok: true, confirmationUrl: payment.paymentUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Не удалось создать платёж";
    console.error("POST /api/payments/create error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
