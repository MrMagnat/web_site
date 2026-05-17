/**
 * Читает значения интеграций из БД с автоматической расшифровкой.
 * Используется в API-маршрутах (orders, webhooks, etc.)
 */
import { prisma } from "./prisma";
import { decrypt, isEncrypted } from "./crypto";

/** Получает одно значение по ключу, расшифровывая при необходимости */
export async function getIntegration(key: string): Promise<string | null> {
  try {
    const row = await prisma.integration.findUnique({ where: { key } });
    if (!row || !row.value) return null;

    // Если значение зашифровано — расшифровываем, иначе возвращаем как есть
    return isEncrypted(row.value) ? decrypt(row.value) : row.value;
  } catch {
    return null;
  }
}

/** Получает несколько значений одним запросом */
export async function getIntegrations(
  keys: string[]
): Promise<Record<string, string | null>> {
  try {
    const rows = await prisma.integration.findMany({
      where: { key: { in: keys } },
    });

    const result: Record<string, string | null> = {};
    for (const key of keys) result[key] = null;

    for (const row of rows) {
      result[row.key] = isEncrypted(row.value)
        ? decrypt(row.value)
        : row.value;
    }

    return result;
  } catch {
    return Object.fromEntries(keys.map((k) => [k, null]));
  }
}

/** Удобный хелпер — ЮКасса */
export async function getYooKassaCreds(): Promise<{
  shopId: string | null;
  secretKey: string | null;
}> {
  const vals = await getIntegrations([
    "yookassa_shop_id",
    "yookassa_secret_key",
  ]);
  return {
    shopId:    vals["yookassa_shop_id"],
    secretKey: vals["yookassa_secret_key"],
  };
}

/** Удобный хелпер — Ozon */
export async function getOzonCreds(): Promise<{
  clientId: string | null;
  apiKey: string | null;
}> {
  const vals = await getIntegrations(["ozon_client_id", "ozon_api_key"]);
  return {
    clientId: vals["ozon_client_id"],
    apiKey:   vals["ozon_api_key"],
  };
}
