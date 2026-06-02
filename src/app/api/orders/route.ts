import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdminHeader(request: NextRequest): boolean {
  return request.headers.get("x-admin") === "true";
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Cart page sends nested { customer, delivery } — support both formats
    const customerName    = body.customerName    ?? body.customer?.name;
    const customerPhone   = body.customerPhone   ?? body.customer?.phone;
    const customerEmail   = body.customerEmail   ?? body.customer?.email;
    const deliveryTypeRaw = body.deliveryType ?? body.delivery?.type ?? "";
    // Normalize frontend kebab-case to Prisma enum (e.g. "ozon-pvz" → "OZON_PVZ")
    const deliveryType = deliveryTypeRaw.toUpperCase().replace(/-/g, "_");
    const deliveryAddress = body.deliveryAddress ?? body.delivery?.address;
    const pvzCode         = body.pvzCode;
    const pvzAddress      = body.pvzAddress;

    const items: Array<{
      productId?: string;
      name: string;
      image?: string;
      size?: string;
      color?: string;
      qty: number;
      price: number;
    }> = body.items ?? [];

    const promoCode: string | undefined = body.promoCode;
    const utmSource      = body.utmSource;
    const utmMedium      = body.utmMedium;
    const utmCampaign    = body.utmCampaign;

    if (!customerName || !customerPhone || !deliveryType || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── ЗАЩИТА ЦЕЛОСТНОСТИ СУММЫ ──────────────────────────────────────────────
    // Цены НЕ берём из тела запроса (клиент мог их подменить). Для каждой
    // позиции с productId берём актуальную цену из БД. Сумма заказа считается
    // на сервере — именно она потом уходит в оплату.
    const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
    const dbProducts = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true, discountPrice: true },
        })
      : [];
    const priceMap = new Map<string, number>(
      dbProducts.map((p: { id: string; price: number; discountPrice: number | null }) => [
        p.id,
        p.discountPrice ?? p.price,
      ])
    );

    // Достоверная цена за единицу для каждой позиции.
    // Каждая позиция ОБЯЗАНА сопоставляться с товаром в БД — иначе цену можно
    // было бы подменить с клиента. Заказы с неизвестными товарами отклоняем.
    const authoritativeItems: typeof items = [];
    for (const item of items) {
      const dbPrice = item.productId ? priceMap.get(item.productId) : undefined;
      if (dbPrice === undefined) {
        return NextResponse.json(
          { error: "Некорректная позиция в заказе (товар не найден)" },
          { status: 400 }
        );
      }
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 999) {
        return NextResponse.json({ error: "Некорректное количество" }, { status: 400 });
      }
      authoritativeItems.push({ ...item, price: dbPrice });
    }

    const subtotal = authoritativeItems.reduce(
      (sum, it) => sum + it.price * it.qty,
      0
    );

    // Generate order number
    const year  = new Date().getFullYear();
    const count = await prisma.order.count();
    const orderNumber = `AF-${year}-${String(count + 1).padStart(4, "0")}`;

    // Validate promo code + вычисляем скидку на сервере
    let promoCodeId: string | undefined;
    let discountPercent = 0;
    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: { code: promoCode, isActive: true },
      });
      if (promo) {
        const now       = new Date();
        const expired   = promo.expiresAt && promo.expiresAt < now;
        const exhausted = promo.maxUses !== null && promo.usedCount >= promo.maxUses;
        if (!expired && !exhausted) {
          promoCodeId = promo.id;
          // защита от некорректного промокода (0..100%)
          discountPercent = Math.min(100, Math.max(0, promo.discountPercent));
        }
      }
    }

    const discountAmount = Math.round(subtotal * discountPercent) / 100;
    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    // Create order + items in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await prisma.$transaction(async (tx: any) => {
      if (promoCodeId) {
        await tx.promoCode.update({
          where: { id: promoCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.order.create({
        data: {
          number: orderNumber,
          status: "PENDING",
          customerName,
          customerPhone,
          customerEmail,
          deliveryType,
          deliveryAddress,
          pvzCode,
          pvzAddress,
          subtotal,
          discountAmount,
          total,
          promoCodeId,
          utmSource,
          utmMedium,
          utmCampaign,
          items: {
            create: authoritativeItems.map((item) => ({
              productId: item.productId,
              name:      item.name,
              image:     item.image ?? "",
              size:      item.size,
              color:     item.color,
              qty:       item.qty,
              price:     item.price, // достоверная цена из БД
            })),
          },
        },
      });
    });

    return NextResponse.json(
      { ok: true, orderId: order.id, orderNumber: order.number },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/orders error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET /api/orders (admin) ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    if (!checkAdminHeader(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
