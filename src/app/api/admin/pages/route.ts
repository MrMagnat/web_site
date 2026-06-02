import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

// GET /api/admin/pages — list all pages
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pages = await prisma.pageContent.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json({ pages });
}

// POST /api/admin/pages — upsert a page
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug, titleRu, content } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const page = await prisma.pageContent.upsert({
    where: { slug },
    create: { slug, titleRu: titleRu ?? "", content: content ?? "" },
    update: { titleRu: titleRu ?? undefined, content: content ?? undefined },
  });
  return NextResponse.json({ page });
}
