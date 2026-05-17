import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "new";
    const isNew = searchParams.get("isNew");
    const isSale = searchParams.get("isSale");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const skip = parseInt(searchParams.get("skip") ?? "0", 10);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }
    if (isNew === "true") {
      where.isNew = true;
    }
    if (isSale === "true") {
      where.discountPrice = { not: null };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Build orderBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { id: "desc" };
    if (sort === "priceAsc") orderBy = { price: "asc" };
    else if (sort === "priceDesc") orderBy = { price: "desc" };
    else if (sort === "popular") orderBy = { id: "desc" }; // fallback; analytics-based sort not supported in simple orderBy
    else orderBy = { id: "desc" }; // new

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
