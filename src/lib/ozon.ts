/**
 * Ozon Logistics API helper
 * Docs: https://docs.ozon.ru/api/logistic-platform/
 * Base URL: https://api-seller.ozon.ru
 */

const OZON_API_URL = "https://api-seller.ozon.ru";

export interface OzonCredentials {
  clientId: string;
  apiKey: string;
}

export interface OzonOrderItem {
  sku: string;      // Ozon SKU (product article/sku in Ozon system)
  quantity: number;
  price: number;
}

export interface OzonCreateOrderParams {
  externalOrderId: string;   // our order number e.g. "AF-2026-0001"
  customerName: string;
  customerPhone: string;
  deliveryType: "OZON_PVZ" | "OZON_COURIER";
  pvzAddress?: string;
  deliveryAddress?: string;
  items: OzonOrderItem[];
}

export interface OzonCreateOrderResult {
  postingNumber: string;
  trackingNumber?: string;
  status: string;
}

export async function createOzonOrder(
  creds: OzonCredentials,
  params: OzonCreateOrderParams
): Promise<OzonCreateOrderResult> {
  const body = {
    posting_number: params.externalOrderId,
    order_id: params.externalOrderId,
    delivery_method: params.deliveryType === "OZON_PVZ" ? "pvz" : "courier",
    recipient: {
      name: params.customerName,
      phone: params.customerPhone,
    },
    address: params.deliveryType === "OZON_PVZ"
      ? { pvz_address: params.pvzAddress }
      : { address_tail: params.deliveryAddress },
    items: params.items.map((i) => ({
      sku: i.sku,
      quantity: i.quantity,
      price: Math.round(i.price * 100), // kopecks
    })),
  };

  const res = await fetch(`${OZON_API_URL}/v2/order/create`, {
    method: "POST",
    headers: {
      "Client-Id": creds.clientId,
      "Api-Key": creds.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `Ozon API error ${res.status}`);
  }

  return {
    postingNumber: data.result?.posting_number ?? data.posting_number ?? "",
    trackingNumber: data.result?.tracking_number ?? data.tracking_number,
    status: data.result?.status ?? "created",
  };
}

export async function getOzonPostingStatus(
  creds: OzonCredentials,
  postingNumber: string
): Promise<{ status: string; trackingNumber?: string }> {
  const res = await fetch(`${OZON_API_URL}/v3/posting/fbs/get`, {
    method: "POST",
    headers: {
      "Client-Id": creds.clientId,
      "Api-Key": creds.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ posting_number: postingNumber }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Ozon status error ${res.status}`);

  return {
    status: data.result?.status ?? "unknown",
    trackingNumber: data.result?.tracking_number,
  };
}
