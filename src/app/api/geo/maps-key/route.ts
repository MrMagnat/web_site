import { NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

/**
 * GET /api/geo/maps-key — публичный ключ Яндекс.Карт для отрисовки карты в браузере.
 * Это клиентский (доменно-ограниченный) ключ JS API, его допустимо отдавать на фронт.
 */
export async function GET() {
  const key = (await getIntegration("yandex_maps_key")) ?? "";
  return NextResponse.json({ key });
}
