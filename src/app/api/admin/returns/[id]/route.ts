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
    const { status, comment } = body;

    const returnRecord = await prisma.return.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(comment !== undefined && { comment }),
      },
    });

    return NextResponse.json({ return: returnRecord });
  } catch (error) {
    console.error("PUT /api/admin/returns/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
