import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerFromRequest, normalizePhone } from "@/lib/customerAuth";

/**
 * GET /api/account/orders — заказы текущего покупателя (по номеру телефона).
 * Авторизация — токен покупателя (Bearer / x-customer-key).
 */
export async function GET(req: NextRequest) {
  const phone = customerFromRequest(req);
  if (!phone) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Берём свежие заказы и фильтруем по нормализованному телефону.
    const recent = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: { items: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mine = recent.filter((o: any) => normalizePhone(o.customerPhone) === phone);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = mine.map((o: any) => ({
      number: o.number,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
      deliveryType: o.deliveryType,
      pvzAddress: o.pvzAddress,
      deliveryAddress: o.deliveryAddress,
      ozonTrackingId: o.ozonTrackingId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: o.items.map((i: any) => ({ name: i.name, qty: i.qty, price: i.price })),
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/account/orders error:", error);
    return NextResponse.json({ error: "Не удалось загрузить заказы" }, { status: 500 });
  }
}
