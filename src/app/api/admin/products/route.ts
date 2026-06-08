import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "desc" },
      include: {
        category: true,
        analytics: true,
      },
    });

    // Sum views + cartAdds from all analytics records per product
    const productsWithStats = products.map((p: typeof products[number]) => {
      const totalViews = p.analytics.reduce((sum: number, a: typeof p.analytics[number]) => sum + a.views, 0);
      const totalCartAdds = p.analytics.reduce((sum: number, a: typeof p.analytics[number]) => sum + a.cartAdds, 0);
      return { ...p, totalViews, totalCartAdds };
    });

    return NextResponse.json({ products: productsWithStats });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      sku,
      nameRu,
      nameEn,
      descriptionRu,
      descriptionEn,
      price,
      discountPrice,
      images,
      sizes,
      colors,
      specsRu,
      specsEn,
      isNew,
      isFeatured,
      isActive,
      categoryId,
      collectionId,
    } = body;

    const product = await prisma.product.create({
      data: {
        sku,
        nameRu,
        nameEn,
        descriptionRu,
        descriptionEn,
        price,
        discountPrice,
        images: images ?? [],
        sizes: sizes ?? [],
        colors: colors ?? {},
        specsRu: specsRu ?? {},
        specsEn: specsEn ?? {},
        isNew: isNew ?? false,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
        categoryId,
        collectionId: collectionId || null,
      },
      include: { category: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
