import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        analytics: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Явный белый список полей — исключаем лишние ключи (иначе Prisma падает
    // и НИЧЕГО не сохраняется, в т.ч. характеристики).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    const scalarKeys = [
      "sku", "nameRu", "nameEn", "descriptionRu", "descriptionEn",
      "price", "discountPrice", "categoryId", "collectionId",
      "isNew", "isFeatured", "isActive",
    ] as const;
    for (const k of scalarKeys) if (k in body) data[k] = body[k];
    // JSON / массивы
    if ("images" in body)  data.images  = body.images  ?? [];
    if ("sizes" in body)   data.sizes   = body.sizes   ?? [];
    if ("colors" in body)  data.colors  = body.colors  ?? {};
    if ("specsRu" in body) data.specsRu = body.specsRu ?? {};
    if ("specsEn" in body) data.specsEn = body.specsEn ?? {};
    // связь коллекции: пустая строка → null
    if ("collectionId" in data) data.collectionId = data.collectionId || null;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
