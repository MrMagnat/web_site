import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOzonCreds } from "@/lib/integrations";
import { createOzonOrder } from "@/lib/ozon";

function checkAdmin(req: NextRequest) {
  return req.headers.get("x-admin") === "true";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  // Get order with items and products
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.ozonPostingId) {
    return NextResponse.json(
      { error: "Заказ уже отправлен в Ozon", postingId: order.ozonPostingId },
      { status: 409 }
    );
  }

  // Get Ozon credentials
  const creds = await getOzonCreds();
  if (!creds.clientId || !creds.apiKey) {
    return NextResponse.json(
      { error: "Ozon API ключи не настроены. Перейдите в Интеграции → Ozon Логистика." },
      { status: 400 }
    );
  }

  // Build items list using product SKU
  const ozonItems = order.items.map((item: { product: { sku: string } | null; name: string; qty: number; price: number }) => ({
    sku: item.product?.sku ?? item.name,
    quantity: item.qty,
    price: item.price,
  }));

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

    // Save posting ID and update status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        ozonPostingId: result.postingNumber,
        ozonTrackingId: result.trackingNumber ?? null,
        status: "SHIPPED",
      },
    });

    return NextResponse.json({
      ok: true,
      postingNumber: result.postingNumber,
      trackingNumber: result.trackingNumber,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Ozon send-order error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
