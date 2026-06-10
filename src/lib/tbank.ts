/**
 * Клиент Т-Банк (Tinkoff) интернет-эквайринг (E-ACQ).
 * Docs: https://developer.tbank.ru/eacq/intro/
 *
 * Авторизация запросов — подпись Token (SHA-256) по алгоритму Т-Банка:
 *  1. Берём все корневые параметры запроса (кроме вложенных объектов и Token).
 *  2. Добавляем пару Password = <пароль терминала>.
 *  3. Сортируем по ключу, конкатенируем значения, берём SHA-256 (hex).
 *
 * БЕЗОПАСНОСТЬ:
 *  • Пароль терминала читается только на сервере (getTBankCreds → расшифровка).
 *  • Сумма платежа задаётся вызывающей стороной из суммы заказа в БД.
 *  • Уведомления (webhook) проверяются тем же Token-алгоритмом.
 */
import { createHash } from "crypto";
import { getTBankCreds } from "./integrations";

const API_URL = "https://securepay.tinkoff.ru/v2";

/** Считает Token по корневым примитивным параметрам + Password. */
function genToken(params: Record<string, unknown>, password: string): string {
  const data: Record<string, unknown> = { ...params, Password: password };
  const concat = Object.keys(data)
    .filter((k) => {
      const v = data[k];
      return (
        k !== "Token" &&
        v !== undefined &&
        v !== null &&
        typeof v !== "object" // исключаем Receipt, DATA и пр.
      );
    })
    .sort()
    .map((k) => String(data[k]))
    .join("");
  return createHash("sha256").update(concat).digest("hex");
}

export interface CreatePaymentParams {
  amountRub: number;
  orderId: string;       // уникальный OrderId (используем order.id)
  description: string;
  successUrl: string;
  failUrl: string;
  notificationUrl: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  paymentUrl: string;
  status: string;
}

/** Создаёт платёж (Init) и возвращает ссылку на оплату. */
export async function createTBankPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResult> {
  const { terminalKey, password } = await getTBankCreds();
  if (!terminalKey || !password) {
    throw new Error("Т-Банк не настроен. Заполните Terminal Key и пароль в админке.");
  }

  const tokenParams: Record<string, unknown> = {
    TerminalKey: terminalKey,
    Amount: Math.round(params.amountRub * 100), // в копейках
    OrderId: params.orderId,
    Description: params.description.slice(0, 140),
    NotificationURL: params.notificationUrl,
    SuccessURL: params.successUrl,
    FailURL: params.failUrl,
  };
  const Token = genToken(tokenParams, password);

  const res = await fetch(`${API_URL}/Init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...tokenParams, Token }),
  });
  const data = await res.json().catch(() => ({}));

  if (!data?.Success) {
    const msg = data?.Message || data?.Details || `Т-Банк Init ошибка ${res.status}`;
    throw new Error(String(msg));
  }
  if (!data.PaymentURL) {
    throw new Error("Т-Банк не вернул ссылку на оплату");
  }

  return {
    paymentId: String(data.PaymentId),
    paymentUrl: data.PaymentURL,
    status: data.Status,
  };
}

/** Проверяет статус платежа напрямую (для верификации уведомления). */
export async function getTBankState(
  paymentId: string
): Promise<{ status: string } | null> {
  const { terminalKey, password } = await getTBankCreds();
  if (!terminalKey || !password) return null;

  const tokenParams = { TerminalKey: terminalKey, PaymentId: paymentId };
  const Token = genToken(tokenParams, password);

  const res = await fetch(`${API_URL}/GetState`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...tokenParams, Token }),
  });
  const data = await res.json().catch(() => null);
  if (!data?.Success) return null;
  return { status: data.Status };
}

/** Проверяет подпись уведомления (webhook) Т-Банка. */
export async function verifyTBankNotification(
  body: Record<string, unknown>
): Promise<boolean> {
  const { password } = await getTBankCreds();
  if (!password) return false;
  const received = String(body.Token ?? "");
  if (!received) return false;
  const expected = genToken(body, password);
  return received === expected;
}
