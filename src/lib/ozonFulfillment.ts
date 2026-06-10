/**
 * Отправка заказа в Ozon Логистику — общий хелпер.
 * Используется и кнопкой в админке (ручная отправка), и webhook'ом оплаты
 * (автоотправка, если включена галка в Интеграциях).
 */
import { prisma } from "./prisma";
import { getOzonCreds } from "./integrations";
import { createOzonOrder } from "./ozon";

export interface SendResult {
  ok: boolean;
  postingNumber?: string;
  trackingNumber?: string;
  error?: string;
  alreadySent?: boolean;
}

export async function sendOrderToOzon(orderId: string): Promise<SendResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) return { ok: false, error: "Заказ не найден" };

  if (order.ozonPostingId) {
    return { ok: true, alreadySent: true, postingNumber: order.ozonPostingId };
  }

  const creds = await getOzonCreds();
  if (!creds.clientId || !creds.apiKey) {
    return { ok: false, error: "Ozon API ключи не настроены (Интеграции → Ozon)." };
  }

  const ozonItems = order.items.map(
    (item: { product: { sku: string } | null; name: string; qty: number; price: number }) => ({
      sku: item.product?.sku ?? item.name,
      quantity: item.qty,
      price: item.price,
    })
  );

  try {
    const result = await createOzonOrder(
      { clientId: creds.clientId, apiKey: creds.apiKey },
      {
        externalOrderId: order.number,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryType: order.deliveryType as "OZON_PVZ" | "OZON_COURIER",
        pvzAddress: order.pvzAddress ?? undefined,
        deliveryAddress: order.deliveryAddress ?? undefined,
        items: ozonItems,
      }
    );

    await prisma.order.update({
      where: { id: orderId },
      data: {
        ozonPostingId: result.postingNumber,
        ozonTrackingId: result.trackingNumber ?? null,
        status: "SHIPPED",
      },
    });

    return {
      ok: true,
      postingNumber: result.postingNumber,
      trackingNumber: result.trackingNumber,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("sendOrderToOzon error:", msg);
    return { ok: false, error: msg };
  }
}
