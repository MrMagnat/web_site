import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ valid: false, message: "Code is required" });
    }

    const normalizedCode = code.trim().toUpperCase();

    const promo = await prisma.promoCode.findFirst({
      where: { code: normalizedCode, isActive: true },
    });

    if (!promo) {
      return NextResponse.json({ valid: false, message: "Promo code not found" });
    }

    const now = new Date();

    if (promo.expiresAt && promo.expiresAt < now) {
      return NextResponse.json({ valid: false, message: "Promo code has expired" });
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ valid: false, message: "Promo code usage limit reached" });
    }

    // Increment appliedCount (fire-and-forget — не блокируем ответ)
    prisma.promoCode
      .update({ where: { id: promo.id }, data: { appliedCount: { increment: 1 } } })
      .catch(() => {/* silent */});

    return NextResponse.json({ valid: true, discountPercent: promo.discountPercent });
  } catch (error) {
    console.error("POST /api/promo/validate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
