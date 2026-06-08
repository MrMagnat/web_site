import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collections = await prisma.collection.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("GET /api/admin/collections error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, nameRu, nameEn, image, sortOrder, isActive } = body;

    if (!slug || !nameRu) {
      return NextResponse.json({ error: "slug and nameRu are required" }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        slug,
        nameRu,
        nameEn,
        image,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/collections error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
