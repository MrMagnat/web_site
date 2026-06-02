import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const returns = await prisma.return.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            number: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            total: true,
          },
        },
      },
    });

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("GET /api/admin/returns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
