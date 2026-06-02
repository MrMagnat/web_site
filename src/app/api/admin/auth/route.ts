import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { issueAdminToken } from "@/lib/adminAuth";

/** Сравнение строк в постоянное время (защита от timing-атак на пароль). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials not configured" },
        { status: 500 }
      );
    }

    const ok =
      safeEqual(String(email ?? ""), adminEmail) &&
      safeEqual(String(password ?? ""), adminPassword);

    if (!ok) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Выдаём подписанный токен с ограниченным сроком жизни
    return NextResponse.json({ token: issueAdminToken(), ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
