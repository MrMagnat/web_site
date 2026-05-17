import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdminAuth(request: NextRequest): boolean {
  return request.headers.get("x-admin-key") === "admin-authenticated";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const utmTag = await prisma.uTMTag.findUnique({
      where: { id },
      include: {
        clicks: {
          where: { timestamp: { gte: thirtyDaysAgo } },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!utmTag) {
      return NextResponse.json({ error: "UTM tag not found" }, { status: 404 });
    }

    // Group clicks by day
    const clicksByDay: Record<string, number> = {};
    for (const click of utmTag.clicks) {
      const day = click.timestamp.toISOString().slice(0, 10);
      clicksByDay[day] = (clicksByDay[day] ?? 0) + 1;
    }

    const clicksPerDay = Object.entries(clicksByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, clicks]) => ({ date, clicks }));

    return NextResponse.json({ utmTag: { ...utmTag, clicksPerDay } });
  } catch (error) {
    console.error("GET /api/admin/utm/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.uTMTag.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/utm/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
