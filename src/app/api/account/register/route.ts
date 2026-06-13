import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone, hashPassword, issueCustomerToken } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  try {
    const { phone, password, name } = await req.json();
    const normalized = normalizePhone(String(phone ?? ""));

    if (normalized.length !== 10) {
      return NextResponse.json({ error: "Введите корректный номер телефона" }, { status: 400 });
    }
    if (!password || String(password).length < 4) {
      return NextResponse.json({ error: "Пароль должен быть не короче 4 символов" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { phone: normalized } });
    if (existing) {
      return NextResponse.json(
        { error: "Этот номер уже зарегистрирован — войдите в кабинет" },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        phone: normalized,
        passwordHash: hashPassword(String(password)),
        name: name ? String(name).slice(0, 80) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      token: issueCustomerToken(normalized),
      name: customer.name,
    });
  } catch (error) {
    console.error("POST /api/account/register error:", error);
    return NextResponse.json({ error: "Не удалось зарегистрироваться" }, { status: 500 });
  }
}
