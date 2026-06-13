import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone, verifyPassword, issueCustomerToken } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();
    const normalized = normalizePhone(String(phone ?? ""));

    if (normalized.length !== 10 || !password) {
      return NextResponse.json({ error: "Введите телефон и пароль" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { phone: normalized } });
    if (!customer || !verifyPassword(String(password), customer.passwordHash)) {
      return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      token: issueCustomerToken(normalized),
      name: customer.name,
    });
  } catch (error) {
    console.error("POST /api/account/login error:", error);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
