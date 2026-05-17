import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getYooKassaCreds } from "@/lib/integrations";

// ЮКасса IP-адреса для верификации (production + test)
// https://yookassa.ru/developers/using-api/webhooks#ip
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
    addr.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0);
  return (toInt(ip) & mask) === (toInt(range) & mask);
}

function isYooKassaIp(ip: string): boolean {
  return YOOKASSA_IPS.some((cidr) => {
    try { return ipInCidr(ip, cidr); }
    catch { return false; }
  });
}

// Верифицируем платёж через API ЮКассы (double-check)
async function verifyPayment(paymentId: string): Promise<{ status: string } | null> {
  const { shopId, secretKey } = await getYooKassaCreds();
  if (!shopId || !secretKey) return null;

  const credentials = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return { status: data.status };
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем IP источника (опционально в dev)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "";

    const isDev = process.env.NODE_ENV === "development";
    if (!isDev && ip && !isYooKassaIp(ip)) {
      console.warn("YooKassa webhook: unauthorized IP", ip);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, event, object } = body;

    if (type !== "notification" || !event || !object) {
      return NextResponse.json({ ok: true }); // игнорируем незнакомые события
    }

    const paymentId    = object.id as string;
    const paymentStatus = object.status as string;
    const orderId      = object.metadata?.orderId as string | undefined;
    const orderNumber  = object.metadata?.orderNumber as string | undefined;

    console.log(`YooKassa webhook: event=${event} payment=${paymentId} order=${orderNumber}`);

    // Находим заказ
    const order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId } })
      : orderNumber
        ? await prisma.order.findFirst({ where: { number: orderNumber } })
        : null;

    if (!order) {
      console.warn("YooKassa webhook: order not found", { orderId, orderNumber });
      return NextResponse.json({ ok: true }); // всё равно 200, чтобы ЮКасса не ретраила
    }

    if (event === "payment.succeeded" && paymentStatus === "succeeded") {
      // Double-check через API
      const verified = await verifyPayment(paymentId);
      if (verified?.status !== "succeeded") {
        console.warn("YooKassa webhook: payment verification failed", paymentId);
        return NextResponse.json({ ok: true });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          kassaReceiptId: paymentId,
        },
      });

      console.log(`Order ${order.number} marked PAID via YooKassa payment ${paymentId}`);
    }

    if (event === "payment.canceled") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      console.log(`Order ${order.number} CANCELLED via YooKassa`);
    }

    // Всегда возвращаем 200 — иначе ЮКасса будет ретраить 24 часа
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/webhooks/yookassa error:", error);
    // Даже при ошибке отвечаем 200 чтобы ЮКасса не ретраила зря
    return NextResponse.json({ ok: false });
  }
}
