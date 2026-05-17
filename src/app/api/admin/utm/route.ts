import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdminAuth(request: NextRequest): boolean {
  return request.headers.get("x-admin-key") === "admin-authenticated";
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const utmTags = await prisma.uTMTag.findMany({
      orderBy: { id: "desc" },
      include: {
        _count: { select: { clicks: true } },
      },
    });

    return NextResponse.json({ utmTags });
  } catch (error) {
    console.error("GET /api/admin/utm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, source, medium, campaign, content, term, baseUrl, isActive } = body;

    if (!name || !baseUrl) {
      return NextResponse.json({ error: "name and baseUrl are required" }, { status: 400 });
    }

    // Build the destination URL with UTM params (for analytics tools / fallback)
    const destUrl = new URL(baseUrl);
    if (source) destUrl.searchParams.set("utm_source", source);
    if (medium) destUrl.searchParams.set("utm_medium", medium);
    if (campaign) destUrl.searchParams.set("utm_campaign", campaign);
    if (content) destUrl.searchParams.set("utm_content", content);
    if (term) destUrl.searchParams.set("utm_term", term);
    const destString = destUrl.toString();

    // First create the record to get the cuid
    const utmTag = await prisma.uTMTag.create({
      data: {
        name,
        source,
        medium,
        campaign,
        content,
        term,
        baseUrl,
        generatedUrl: destString, // temporary; updated below
        isActive: isActive ?? true,
      },
    });

    // Build tracking URL: /api/utm/track?tag=<id>&to=<encodedDest>
    const origin = request.headers.get("origin") ?? request.headers.get("host") ?? "https://andrua-famil.ru";
    const base = origin.startsWith("http") ? origin : `https://${origin}`;
    const trackingUrl = `${base}/api/utm/track?tag=${utmTag.id}&to=${encodeURIComponent(destString)}`;

    // Update generatedUrl to the tracking link
    const updated = await prisma.uTMTag.update({
      where: { id: utmTag.id },
      data: { generatedUrl: trackingUrl },
    });

    return NextResponse.json({ utmTag: updated }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/utm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
