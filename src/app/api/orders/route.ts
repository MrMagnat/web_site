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
    const deliveryType    = body.deliveryType    ?? body.delivery?.type;
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

    const subtotal       = body.subtotal       ?? 0;
    const discountAmount = body.discountAmount  ?? (body.subtotal != null && body.total != null
      ? body.subtotal - body.total : 0);
    const total          = body.total          ?? subtotal;
    const promoCode: string | undefined = body.promoCode;
    const utmSource      = body.utmSource;
    const utmMedium      = body.utmMedium;
    const utmCampaign    = body.utmCampaign;

    if (!customerName || !customerPhone || !deliveryType || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate order number
    const year  = new Date().getFullYear();
    const count = await prisma.order.count();
    const orderNumber = `AF-${year}-${String(count + 1).padStart(4, "0")}`;

    // Validate promo code
    let promoCodeId: string | undefined;
    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: { code: promoCode, isActive: true },
      });
      if (promo) {
        const now       = new Date();
        const expired   = promo.expiresAt && promo.expiresAt < now;
        const exhausted = promo.maxUses !== null && promo.usedCount >= promo.maxUses;
        if (!expired && !exhausted) promoCodeId = promo.id;
      }
    }

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
            create: items.map((item) => ({
              productId: item.productId,
              name:      item.name,
              image:     item.image ?? "",
              size:      item.size,
              color:     item.color,
              qty:       item.qty,
              price:     item.price,
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
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
