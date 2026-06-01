import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOzonCreds } from "@/lib/integrations";

function checkAdmin(req: NextRequest) {
  return (
    req.headers.get("x-admin-key") === "admin-authenticated" ||
    req.headers.get("x-admin") === "true"
  );
}

// Маппинг статусов Ozon FBO → статусы сайта
const OZON_STATUS_MAP: Record<string, string> = {
  awaiting_packaging:          "PROCESSING",
  awaiting_deliver:            "PROCESSING",
  arbitration:                 "PROCESSING",
  client_arbitration:          "PROCESSING",
  delivering:                  "SHIPPED",
  driver_pickup:               "SHIPPED",
  delivered:                   "DELIVERED",
  cancelled:                   "CANCELLED",
  not_accepted:                "CANCELLED",
  cancelled_waiting_decision:  "CANCELLED",
  returned:                    "RETURNED",
};

// Финальные статусы — больше не опрашиваем
const FINAL_STATUSES = new Set(["DELIVERED", "CANCELLED", "RETURNED"]);

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creds = await getOzonCreds();
  if (!creds.clientId || !creds.apiKey) {
    return NextResponse.json({ error: "Ozon API ключи не настроены" }, { status: 400 });
  }

  // Все заказы с ozonPostingId, которые ещё не в финальном статусе
  const orders = await prisma.order.findMany({
    where: {
      ozonPostingId: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
    },
    select: { id: true, ozonPostingId: true, status: true },
  });

  if (!orders.length) {
    return NextResponse.json({ updated: 0, message: "Нет активных заказов для синхронизации" });
  }

  let updated = 0;
  const changes: Array<{ orderId: string; from: string; to: string }> = [];

  for (const order of orders) {
    if (!order.ozonPostingId) continue;

    try {
      const res = await fetch("https://api-seller.ozon.ru/v2/posting/fbo/get", {
        method: "POST",
        headers: {
          "Client-Id": creds.clientId!,
          "Api-Key":   creds.apiKey!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          posting_number: order.ozonPostingId,
          with: { analytics_data: false, financial_data: false },
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const ozonStatus: string = data?.result?.status ?? "";
      const newStatus = OZON_STATUS_MAP[ozonStatus];

      if (!newStatus || newStatus === order.status) continue;

      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });

      changes.push({ orderId: order.id, from: order.status, to: newStatus });
      updated++;

      // Если стал финальным — дальше не опрашиваем (уже обновили)
      if (FINAL_STATUSES.has(newStatus)) continue;

    } catch {
      // пропускаем ошибочные, продолжаем
    }
  }

  return NextResponse.json({
    updated,
    checked: orders.length,
    changes,
    message: `Проверено заказов: ${orders.length}. Обновлено статусов: ${updated}.`,
  });
}
