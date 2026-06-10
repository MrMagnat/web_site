import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { sendOrderToOzon } from "@/lib/ozonFulfillment";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const result = await sendOrderToOzon(orderId);

  if (result.alreadySent) {
    return NextResponse.json(
      { error: "Заказ уже отправлен в Ozon", postingId: result.postingNumber },
      { status: 409 }
    );
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    postingNumber: result.postingNumber,
    trackingNumber: result.trackingNumber,
  });
}
