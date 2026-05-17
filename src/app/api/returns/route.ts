import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function generateReturnNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.return.count();
  const seq = String(count + 1).padStart(4, "0");
  return `RET-${year}-${seq}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, orderNumber, reason, returnMethod } = body;

    if (!orderNumber || !reason) {
      return NextResponse.json(
        { error: "Укажите номер заказа и причину возврата" },
        { status: 400 }
      );
    }

    // Find order by number
    const order = await prisma.order.findFirst({
      where: { number: orderNumber.trim().toUpperCase() },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Заказ с таким номером не найден. Проверьте номер заказа." },
        { status: 404 }
      );
    }

    const returnNumber = await generateReturnNumber();

    const returnRecord = await prisma.return.create({
      data: {
        number: returnNumber,
        orderId: order.id,
        reason: reason.trim(),
        returnMethod: returnMethod === "OZON" ? "OZON" : "DIRECT",
        status: "PENDING",
        customerName: name?.trim() || undefined,
        customerEmail: email?.trim() || undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      returnId: returnRecord.id,
      returnNumber: returnRecord.number,
    });
  } catch (error) {
    console.error("POST /api/returns error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
