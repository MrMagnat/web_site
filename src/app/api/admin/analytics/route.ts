import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdminAuth(request: NextRequest): boolean {
  return request.headers.get("x-admin-key") === "admin-authenticated";
}

function getPeriodDays(period: string): number {
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  return 30; // default 30d
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30d";
    const days = getPeriodDays(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Total visits
    const totalVisits = await prisma.siteVisit.count({
      where: { timestamp: { gte: startDate } },
    });

    // Total orders + revenue
    const ordersAgg = await prisma.order.aggregate({
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      _sum: { total: true },
    });
    const totalOrders = ordersAgg._count.id;
    const totalRevenue = ordersAgg._sum.total ?? 0;

    // Conversion rate
    const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

    // Top products by views
    const analyticsAgg = await prisma.productAnalytics.groupBy({
      by: ["productId"],
      where: { date: { gte: startDate } },
      _sum: { views: true, cartAdds: true },
      orderBy: { _sum: { views: "desc" } },
      take: 10,
    });

    type AnalyticsAggItem = (typeof analyticsAgg)[number];
    const productIds = analyticsAgg.map((a: AnalyticsAggItem) => a.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nameRu: true, nameEn: true, images: true, price: true },
    });
    type ProductDetail = (typeof topProductDetails)[number];

    const topProducts = analyticsAgg.map((a: AnalyticsAggItem) => ({
      productId: a.productId,
      views: a._sum.views ?? 0,
      cartAdds: a._sum.cartAdds ?? 0,
      product: topProductDetails.find((p: ProductDetail) => p.id === a.productId),
    }));

    // Генерируем все дни периода (нули для дней без данных)
    const allDays: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      allDays.push(d.toISOString().slice(0, 10));
    }

    // Visits by day
    const visits = await prisma.siteVisit.findMany({
      where: { timestamp: { gte: startDate } },
      select: { timestamp: true },
    });

    const visitsByDayMap: Record<string, number> = {};
    for (const v of visits) {
      const day = v.timestamp.toISOString().slice(0, 10);
      visitsByDayMap[day] = (visitsByDayMap[day] ?? 0) + 1;
    }
    // Заполняем все дни нулями чтобы ось X была полной
    const visitsByDay = allDays.map((date) => ({
      date,
      visits: visitsByDayMap[date] ?? 0,
    }));

    // Orders by day
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, total: true },
    });

    const ordersByDayMap: Record<string, { orders: number; revenue: number }> = {};
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      if (!ordersByDayMap[day]) ordersByDayMap[day] = { orders: 0, revenue: 0 };
      ordersByDayMap[day].orders += 1;
      ordersByDayMap[day].revenue += Number(o.total);
    }
    // Заполняем все дни нулями
    const ordersByDay = allDays.map((date) => ({
      date,
      orders: ordersByDayMap[date]?.orders ?? 0,
      revenue: ordersByDayMap[date]?.revenue ?? 0,
    }));

    // UTM stats: group visits by utmSource
    const utmVisits = await prisma.siteVisit.findMany({
      where: { timestamp: { gte: startDate }, utmSource: { not: null } },
      select: { utmSource: true },
    });

    const utmClickMap: Record<string, number> = {};
    for (const v of utmVisits) {
      const src = v.utmSource ?? "direct";
      utmClickMap[src] = (utmClickMap[src] ?? 0) + 1;
    }

    const utmOrderMap: Record<string, number> = {};
    const utmOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, utmSource: { not: null } },
      select: { utmSource: true },
    });
    for (const o of utmOrders) {
      const src = o.utmSource ?? "direct";
      utmOrderMap[src] = (utmOrderMap[src] ?? 0) + 1;
    }

    const utmStats = Object.keys(utmClickMap).map((source) => ({
      source,
      clicks: utmClickMap[source] ?? 0,
      orders: utmOrderMap[source] ?? 0,
    }));

    return NextResponse.json({
      period,
      totalVisits,
      totalOrders,
      totalRevenue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      topProducts,
      visitsByDay,
      ordersByDay,
      utmStats,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
