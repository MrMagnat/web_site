import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Аутентификация админки на подписанных токенах (HMAC-SHA256).
 *
 * Раньше токен был константой "admin-authenticated" — кто угодно мог его
 * подставить и пройти авторизацию. Теперь токен выдаётся только после проверки
 * логина/пароля и подписывается серверным секретом, поэтому подделать его нельзя.
 *
 * Формат токена:  base64url({ exp }) + "." + base64url(HMAC)
 *  • exp — момент истечения (мс). Сервер отвергает просроченные токены.
 *  • Никаких секретов внутри токена нет — только срок жизни и подпись.
 */

const TTL_MS = 12 * 60 * 60 * 1000; // 12 часов

function getSecret(): string {
  // Серверный секрет (никогда не уходит клиенту)
  const s = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY;
  if (!s) {
    throw new Error("NEXTAUTH_SECRET (или ENCRYPTION_KEY) не задан — нельзя подписать токен админки");
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", getSecret()).update(payloadB64).digest());
}

/** Выдаёт новый подписанный токен (вызывается после успешного логина). */
export function issueAdminToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + TTL_MS });
  const payloadB64 = b64url(Buffer.from(payload, "utf8"));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** Проверяет токен: корректная подпись + не истёк. */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  // Сравнение подписи в постоянное время (защита от timing-атак)
  const expected = sign(payloadB64);
  const a = Buffer.from(sigB64);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const json = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}

/** Извлекает токен из заголовков запроса (x-admin-key или Authorization: Bearer). */
function tokenFromRequest(req: NextRequest): string | null {
  const key = req.headers.get("x-admin-key");
  if (key) return key;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/** true, если запрос аутентифицирован как админ. */
export function isAdmin(req: NextRequest): boolean {
  return verifyAdminToken(tokenFromRequest(req));
}

/** Хелпер для роутов: вернёт 401-ответ, либо null если доступ разрешён. */
export function checkAdminAuth(req: NextRequest): NextResponse | null {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
