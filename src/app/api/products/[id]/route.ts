import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Track view in ProductAnalytics
    const today = new Date(new Date().toDateString());
    try {
      await prisma.productAnalytics.upsert({
        where: { productId_date: { productId: product.id, date: today } },
        update: { views: { increment: 1 } },
        create: { productId: product.id, date: today, views: 1, cartAdds: 0 },
      });
    } catch (analyticsError) {
      console.error("Analytics tracking error:", analyticsError);
      // Non-fatal, continue
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
