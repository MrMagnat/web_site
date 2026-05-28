import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdmin(req: NextRequest) {
  return req.headers.get("x-admin-key") === "admin-authenticated";
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.integration.findMany({
    where: { key: { in: ["hero_type", "hero_url"] } },
  });
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { hero_type, hero_url } = await req.json();
  const updates = [];
  if (hero_type) updates.push(prisma.integration.upsert({
    where: { key: "hero_type" }, create: { key: "hero_type", value: hero_type },
    update: { value: hero_type },
  }));
  if (hero_url !== undefined) updates.push(prisma.integration.upsert({
    where: { key: "hero_url" }, create: { key: "hero_url", value: hero_url },
    update: { value: hero_url },
  }));
  await prisma.$transaction(updates);
  return NextResponse.json({ ok: true });
}
