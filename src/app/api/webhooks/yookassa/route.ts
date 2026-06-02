import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getYooKassaPayment } from "@/lib/yookassa";

/**
 * Webhook ЮKassa: уведомления о статусе платежа.
 *
 * БЕЗОПАСНОСТЬ (несколько слоёв):
 *  1. Проверка IP-источника по официальному списку сетей ЮKassa.
 *  2. Тело webhook'а НЕ доверенное: статус «оплачено» подтверждаем повторным
 *     запросом к API ЮKassa (getYooKassaPayment).
 *  3. Идемпотентность: повторные уведомления по уже оплаченному заказу — no-op.
 *  4. Всегда отвечаем 200 — иначе ЮKassa ретраит до 24 часов.
 *
 * https://yookassa.ru/developers/using-api/webhooks
 */

const YOOKASSA_IPS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11",
  "77.75.156.35",
  "77.75.154.128/25",
];

function ipInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) return ip === cidr;
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - Number(bits)) - 1);
  const toInt = (addr: string) =>
    (addr.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0)) >>> 0;
  return ((toInt(ip) & mask) >>> 0) === ((toInt(range) & mask) >>> 0);
}

function isYooKassaIp(ip: string): boolean {
  return YOOKASSA_IPS.some((cidr) => {
    try { return ipInCidr(ip, cidr); }
    catch { return false; }
  });
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Проверка IP ───────────────────────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "";

    const isDev = process.env.NODE_ENV === "development";
    if (!isDev && ip && !isYooKassaIp(ip)) {
      console.warn("YooKassa webhook: запрос с неразрешённого IP", ip);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, event, object } = body;

    if (type !== "notification" || !event || !object) {
      return NextResponse.json({ ok: true }); // незнакомое событие — игнор
    }

    const paymentId   = object.id as string;
    const orderId     = object.metadata?.orderId as string | undefined;
    const orderNumber = object.metadata?.orderNumber as string | undefined;

    console.log(`YooKassa webhook: event=${event} payment=${paymentId} order=${orderNumber ?? orderId}`);

    // ── Находим заказ (по metadata или по сохранённому paymentId) ──────────────
    const order =
      (orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null) ??
      (orderNumber ? await prisma.order.findFirst({ where: { number: orderNumber } }) : null) ??
      (paymentId ? await prisma.order.findFirst({ where: { kassaPaymentId: paymentId } }) : null);

    if (!order) {
      console.warn("YooKassa webhook: заказ не найден", { orderId, orderNumber, paymentId });
      return NextResponse.json({ ok: true }); // 200, чтобы не ретраили
    }

    // ── Идемпотентность ────────────────────────────────────────────────────────
    if (order.status === "PAID") {
      return NextResponse.json({ ok: true });
    }

    // ── 2. Успешная оплата — подтверждаем через API, не доверяя телу ───────────
    if (event === "payment.succeeded") {
      const verified = await getYooKassaPayment(paymentId);
      if (!verified || verified.status !== "succeeded" || !verified.paid) {
        console.warn("YooKassa webhook: API не подтвердил оплату", paymentId);
        return NextResponse.json({ ok: true });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          kassaPaymentId: paymentId,
          kassaReceiptId: paymentId,
        },
      });
      console.log(`Заказ ${order.number} → PAID (платёж ${paymentId})`);
    }

    // ── Отмена платежа — тоже подтверждаем через API ──────────────────────────
    if (event === "payment.canceled") {
      const verified = await getYooKassaPayment(paymentId);
      if (verified && verified.status === "canceled") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        console.log(`Заказ ${order.number} → CANCELLED (платёж отменён)`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/webhooks/yookassa error:", error);
    return NextResponse.json({ ok: false });
  }
}
