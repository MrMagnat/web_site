import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    await prisma.subscriber.upsert({
      where: { email },
      update: { locale: locale ?? "ru" },
      create: { email, locale: locale ?? "ru" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/newsletter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
