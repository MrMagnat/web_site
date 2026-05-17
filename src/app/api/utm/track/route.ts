import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/utm/track?tag=<utmTagId>&to=<destination>
// Records a click and redirects to `to` (or site root).
// Also supports legacy ?utmTagId=<id> for backwards compatibility.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Support both param names
    const utmTagId = searchParams.get("tag") ?? searchParams.get("utmTagId");
    const destination = searchParams.get("to") ?? "/";

    if (!utmTagId) {
      return NextResponse.redirect(new URL(destination, request.url));
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = request.headers.get("user-agent") ?? "";
    const referer = request.headers.get("referer") ?? "";

    // Fire-and-forget — don't block the redirect on DB errors
    prisma.uTMClick
      .create({
        data: {
          utmTagId,
          ip,
          userAgent,
          referer,
          timestamp: new Date(),
        },
      })
      .catch((err: unknown) => {
        console.error("UTM click record error:", err);
      });

    // Redirect immediately
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    console.error("GET /api/utm/track error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// POST /api/utm/track  { utmTagId: string }
// Used by inline JS tracking (no redirect needed).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const utmTagId: string | undefined = body?.utmTagId;

    if (!utmTagId) {
      return NextResponse.json({ error: "utmTagId is required" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = request.headers.get("user-agent") ?? "";
    const referer = request.headers.get("referer") ?? "";

    await prisma.uTMClick.create({
      data: {
        utmTagId,
        ip,
        userAgent,
        referer,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/utm/track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
