import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALL_KEYS = [
  "hero_type", "hero_url",
  "banner_image", "banner_tag", "banner_title_1", "banner_title_2",
  "banner_subtitle", "banner_cta",
] as const;

function checkAdmin(req: NextRequest) {
  return (
    req.headers.get("x-admin") === "true" ||
    req.headers.get("x-admin-key") === "admin-authenticated"
  );
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.integration.findMany({
    where: { key: { in: [...ALL_KEYS] } },
  });
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const updates = ALL_KEYS
    .filter((k) => body[k] !== undefined)
    .map((k) =>
      prisma.integration.upsert({
        where: { key: k },
        create: { key: k, value: String(body[k]) },
        update: { value: String(body[k]) },
      })
    );

  if (updates.length) await prisma.$transaction(updates);
  return NextResponse.json({ ok: true });
}
