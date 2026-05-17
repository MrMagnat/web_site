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
      update: { views: { increment: 1 } },
      create: { productId, date: today, views: 1, cartAdds: 0 },
    });

    // Also create a SiteVisit record
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = request.headers.get("user-agent") ?? "";

    await prisma.siteVisit.create({
      data: {
        page: `/products/${productId}`,
        utmSource: request.headers.get("referer") ?? undefined,
        ip,
        userAgent,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/analytics/view error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
