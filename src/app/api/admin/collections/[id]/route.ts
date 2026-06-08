import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

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

    const collection = await prisma.collection.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("PUT /api/admin/collections/[id] error:", error);
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

    // Check if the collection has products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productCount = await (prisma as any).product.count({
      where: { collectionId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Нельзя удалить коллекцию: в ней ${productCount} товар(ов). Сначала перенесите или удалите товары.`,
        },
        { status: 409 }
      );
    }

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/collections/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
