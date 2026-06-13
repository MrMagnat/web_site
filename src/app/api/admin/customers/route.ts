import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";
import { normalizePhone } from "@/lib/customerAuth";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
      include: { items: true },
    });

    // Группируем заказы по нормализованному телефону.
    const ordersByPhone = new Map<string, typeof orders>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.forEach((order: any) => {
      const key = normalizePhone(order.customerPhone);
      const list = ordersByPhone.get(key) ?? [];
      list.push(order);
      ordersByPhone.set(key, list);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = customers.map((c: any) => {
      const custOrders = ordersByPhone.get(c.phone) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalSpent = custOrders.reduce((sum: number, o: any) => sum + o.total, 0);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        createdAt: c.createdAt,
        ordersCount: custOrders.length,
        totalSpent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orders: custOrders.map((o: any) => ({
          number: o.number,
          status: o.status,
          total: o.total,
          createdAt: o.createdAt,
        })),
      };
    });

    return NextResponse.json({ customers: result });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
