/**
 * Клиент ЮKassa API (v3).  https://yookassa.ru/developers/api
 *
 * БЕЗОПАСНОСТЬ:
 *  • Секретный ключ читается ТОЛЬКО на сервере (getYooKassaCreds → расшифровка из БД).
 *  • Ключ никогда не попадает в ответы клиенту и не логируется.
 *  • Сумма платежа задаётся вызывающей стороной из ДАННЫХ БД (не с клиента).
 *  • Idempotence-Key защищает от двойного списания при повторных запросах.
 */
import { randomUUID } from "crypto";
import { getYooKassaCreds } from "./integrations";

const API_URL = "https://api.yookassa.ru/v3";

export interface ReceiptItem {
  description: string;   // название товара (макс. 128 символов)
  quantity: number;
  amountRub: number;     // цена за единицу, в рублях
  vatCode: number;       // 1 = без НДС, 2 = 0%, 3 = 10%, 4 = 20%, 5 = 10/110, 6 = 20/120
}

export interface CreatePaymentParams {
  /** Сумма к оплате в рублях (берётся из заказа на сервере) */
  amountRub: number;
  description: string;
  orderId: string;
  orderNumber: string;
  returnUrl: string;
  /** Ключ идемпотентности (рекомендуется order.id — повтор не создаст второй платёж) */
  idempotenceKey?: string;
  /** Данные чека 54-ФЗ (если включена фискализация) */
  receipt?: {
    email?: string;
    phone?: string;
    items: ReceiptItem[];
  };
}

export interface CreatePaymentResult {
  id: string;
  status: string;
  confirmationUrl: string;
}

/** Форматирует сумму в строку "1234.00" как требует ЮKassa */
function money(rub: number): string {
  return (Math.round(rub * 100) / 100).toFixed(2);
}

function authHeader(shopId: string, secretKey: string): string {
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

/**
 * Создаёт платёж в ЮKassa и возвращает confirmation_url для редиректа.
 * Бросает Error с понятным сообщением при сбое.
 */
export async function createYooKassaPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResult> {
  const { shopId, secretKey } = await getYooKassaCreds();
  if (!shopId || !secretKey) {
    throw new Error("ЮKassa не настроена. Заполните Shop ID и секретный ключ в админке.");
  }

  // Тело запроса. Сумма — из переданного значения (сервер вычислил из заказа).
  const body: Record<string, unknown> = {
    amount: { value: money(params.amountRub), currency: "RUB" },
    capture: true, // одностадийная оплата — сразу списываем
    confirmation: { type: "redirect", return_url: params.returnUrl },
    description: params.description.slice(0, 128),
    metadata: { orderId: params.orderId, orderNumber: params.orderNumber },
  };

  // Чек 54-ФЗ (только если включена фискализация и есть контакт покупателя)
  if (params.receipt && (params.receipt.email || params.receipt.phone)) {
    body.receipt = {
      customer: {
        ...(params.receipt.email ? { email: params.receipt.email } : {}),
        ...(params.receipt.phone ? { phone: params.receipt.phone } : {}),
      },
      items: params.receipt.items.map((it) => ({
        description: it.description.slice(0, 128),
        quantity: it.quantity,
        amount: { value: money(it.amountRub), currency: "RUB" },
        vat_code: it.vatCode,
        payment_mode: "full_payment",
        payment_subject: "commodity",
      })),
    };
  }

  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(shopId, secretKey),
      "Idempotence-Key": params.idempotenceKey || randomUUID(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // НЕ логируем секреты — только описание ошибки от ЮKassa
    const msg = data?.description || data?.code || `ЮKassa API error ${res.status}`;
    throw new Error(String(msg));
  }

  const confirmationUrl: string | undefined = data?.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    throw new Error("ЮKassa не вернула ссылку на оплату");
  }

  return {
    id: data.id,
    status: data.status,
    confirmationUrl,
  };
}

/** Проверяет статус платежа напрямую через API (для верификации webhook'а) */
export async function getYooKassaPayment(
  paymentId: string
): Promise<{ status: string; paid: boolean } | null> {
  const { shopId, secretKey } = await getYooKassaCreds();
  if (!shopId || !secretKey) return null;

  const res = await fetch(`${API_URL}/payments/${paymentId}`, {
    headers: { Authorization: authHeader(shopId, secretKey) },
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;

  return { status: data.status, paid: data.paid === true };
}
