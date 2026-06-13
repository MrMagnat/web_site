import { NextRequest } from "next/server";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Аутентификация покупателя (личный кабинет) по телефону + паролю.
 * Токен — HMAC-подпись (как у админки), пароль хранится как scrypt-хеш.
 */

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY;
  if (!s) throw new Error("NEXTAUTH_SECRET не задан");
  return s;
}

/** Нормализует телефон → последние 10 цифр (канонический ключ). */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.slice(-10);
}

// ── Пароль (scrypt) ────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return false;
    const hash = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

// ── Токен ──────────────────────────────────────────────────────────
function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", getSecret()).update(payloadB64).digest());
}

export function issueCustomerToken(phone: string): string {
  const payload = JSON.stringify({ phone, exp: Date.now() + TTL_MS });
  const payloadB64 = b64url(Buffer.from(payload, "utf8"));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** Возвращает телефон из валидного токена, либо null. */
export function verifyCustomerToken(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  const a = Buffer.from(sigB64);
  const b = Buffer.from(sign(payloadB64));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
    if (typeof json.exp !== "number" || json.exp < Date.now()) return null;
    return typeof json.phone === "string" ? json.phone : null;
  } catch {
    return null;
  }
}

/** Достаёт телефон покупателя из запроса (Authorization: Bearer / x-customer-key). */
export function customerFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : req.headers.get("x-customer-key");
  return verifyCustomerToken(token);
}
