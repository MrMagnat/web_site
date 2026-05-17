import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const page: string = body?.page ?? "/";

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = request.headers.get("user-agent") ?? "";
    const referer = request.headers.get("referer") ?? "";

    // Извлекаем UTM-параметры из referer или из тела запроса
    const utmSource: string | undefined = body?.utmSource ?? undefined;
    const utmMedium: string | undefined = body?.utmMedium ?? undefined;
    const utmCampaign: string | undefined = body?.utmCampaign ?? undefined;

    await prisma.siteVisit.create({
      data: {
        page,
        ip,
        userAgent,
        utmSource,
        utmMedium,
        utmCampaign,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/analytics/pageview error:", error);
    // Не возвращаем ошибку — трекинг не должен ломать страницу
    return NextResponse.json({ ok: false });
  }
}
