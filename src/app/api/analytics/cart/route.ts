import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const today = new Date(new Date().toDateString());

    await prisma.productAnalytics.upsert({
      where: { productId_date: { productId, date: today } },
      update: { cartAdds: { increment: 1 } },
      create: { productId, date: today, views: 0, cartAdds: 1 },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/analytics/cart error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
