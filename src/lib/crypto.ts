/**
 * AES-256-GCM шифрование для хранения секретов в БД.
 * Требует ENCRYPTION_KEY в .env — 64-символьная hex-строка (32 байта).
 *
 * Формат зашифрованного значения: iv:authTag:ciphertext  (все в hex)
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH  = 16; // байт
const TAG_LENGTH = 16; // байт

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY not set or wrong length. Run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" and add to .env"
    );
  }
  return Buffer.from(hex, "hex");
}

/** Шифрует plaintext → возвращает строку для хранения в БД */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv  = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Формат: iv:authTag:ciphertext (всё в hex)
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

/** Расшифровывает строку из БД → plaintext. Возвращает null при ошибке. */
export function decrypt(stored: string): string | null {
  try {
    const key = getKey();
    const parts = stored.split(":");
    if (parts.length !== 3) return null;

    const [ivHex, tagHex, dataHex] = parts;
    const iv       = Buffer.from(ivHex, "hex");
    const authTag  = Buffer.from(tagHex, "hex");
    const data     = Buffer.from(dataHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(data) + decipher.final("utf8");
  } catch {
    return null; // неверный ключ или повреждённые данные
  }
}

/** Определяет, выглядит ли значение как зашифрованное (iv:tag:data) */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
}
