import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTBankNotification, getTBankState } from "@/lib/tbank";
import { getIntegration } from "@/lib/integrations";
import { sendOrderToOzon } from "@/lib/ozonFulfillment";

/**
 * Webhook Т-Банка: уведомления о статусе платежа.
 * https://developer.tbank.ru/eacq/notifications/
 *
 * БЕЗОПАСНОСТЬ:
 *  1. Подпись Token проверяется (verifyTBankNotification) — подделать нельзя.
 *  2. Статус «оплачено» дополнительно подтверждается запросом GetState.
 *  3. Идемпотентность: повторное уведомление по оплаченному заказу — no-op.
 *  4. В ответ Т-Банк ждёт тело "OK".
 *
 * Автоотправка в Ozon: если в Интеграциях включена галка ozon_auto_send,
 * после подтверждения оплаты заказ сразу уходит в Ozon. Иначе — вручную
 * кнопкой «Отправить» в карточке заказа.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    // 1. Проверка подписи
    const valid = await verifyTBankNotification(body);
    if (!valid) {
      console.warn("T-Bank webhook: неверная подпись Token");
      return new NextResponse("OK"); // не раскрываем детали
    }

    const paymentId = String(body.PaymentId ?? "");
    const orderId = String(body.OrderId ?? "");
    const status = String(body.Status ?? "");

    console.log(`T-Bank webhook: order=${orderId} payment=${paymentId} status=${status}`);

    const order =
      (orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null) ??
      (paymentId ? await prisma.order.findFirst({ where: { kassaPaymentId: paymentId } }) : null);

    if (!order) {
      console.warn("T-Bank webhook: заказ не найден", { orderId, paymentId });
      return new NextResponse("OK");
    }

    if (order.status === "PAID" || order.status === "SHIPPED") {
      return new NextResponse("OK"); // уже обработан
    }

    // 2. Успешная оплата — подтверждаем через GetState (не доверяем телу)
    if (status === "CONFIRMED") {
      const verified = await getTBankState(paymentId);
      if (verified?.status !== "CONFIRMED") {
        console.warn("T-Bank webhook: GetState не подтвердил оплату", paymentId);
        return new NextResponse("OK");
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", kassaPaymentId: paymentId, kassaReceiptId: paymentId },
      });
      console.log(`Заказ ${order.number} → PAID (Т-Банк ${paymentId})`);

      // 3. Автоотправка в Ozon, если включена
      const autoSend = await getIntegration("ozon_auto_send");
      if (autoSend === "1" || autoSend === "true") {
        const r = await sendOrderToOzon(order.id);
        if (r.ok) console.log(`Заказ ${order.number} автоотправлен в Ozon: ${r.postingNumber ?? "—"}`);
        else console.warn(`Автоотправка в Ozon не удалась для ${order.number}: ${r.error}`);
      }
    }

    // Отмена / отклонение
    if (status === "REJECTED" || status === "CANCELED" || status === "DEADLINE_EXPIRED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      console.log(`Заказ ${order.number} → CANCELLED (Т-Банк ${status})`);
    }

    return new NextResponse("OK");
  } catch (error) {
    console.error("POST /api/webhooks/tbank error:", error);
    return new NextResponse("OK"); // всегда OK, чтобы Т-Банк не ретраил бесконечно
  }
}
