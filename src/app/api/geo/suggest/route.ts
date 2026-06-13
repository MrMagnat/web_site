import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

/**
 * GET /api/geo/suggest?q=...  — подсказки адресов (через наш сервер).
 *
 * Браузер обращается к НАШЕМУ домену (нет блокировок/CORS зарубежных сервисов).
 * Источник:
 *   1) DaData (если задан токен в Интеграциях) — мгновенный поиск по части слова,
 *      российские адреса. Это основной и рекомендуемый вариант.
 *   2) Photon (OSM) — запасной, если токен DaData не задан.
 *
 * Ответ: { suggestions: [{ label, detail }] }
 */

interface Suggestion { label: string; detail?: string }

async function fromDaData(q: string, token: string): Promise<Suggestion[]> {
  const res = await fetch(
    "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ query: q, count: 8 }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.suggestions ?? []).map((s: any) => ({
    label: s.value as string,
    detail: s.data?.postal_code ? String(s.data.postal_code) : undefined,
  }));
}

async function fromNominatim(q: string, ozonOnly: boolean): Promise<Suggestion[]> {
  try {
    // Для режима ПВЗ ищем именно точки Ozon в OSM (название «Озон»),
    // обычные адреса при этом не показываем.
    const queryText = ozonOnly ? `Озон ${q}` : q;
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}` +
      `&format=jsonv2&addressdetails=1&namedetails=1&limit=15&countrycodes=ru&accept-language=ru`;
    const res = await fetch(url, {
      headers: { "User-Agent": "andruafamil.ru (shop address search)", "Accept-Language": "ru" },
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    for (const r of data) {
      const a = r.address ?? {};
      const name: string = r.name || r.namedetails?.name || "";

      if (ozonOnly) {
        // оставляем только реальные точки Ozon (по названию)
        const hay = `${name} ${r.display_name ?? ""}`.toLowerCase();
        if (!/озон|ozon/.test(hay)) continue;
      }

      const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? "";
      const street = [a.road, a.house_number].filter(Boolean).join(", ");
      const addr = [city, street].filter(Boolean).join(", ");
      const label = ozonOnly
        ? (addr || (r.display_name as string) || name)
        : (addr || (r.display_name as string) || "");
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push({ label, detail: ozonOnly ? "Пункт выдачи Ozon" : a.postcode });
    }
    return out.slice(0, 8);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const type = req.nextUrl.searchParams.get("type"); // "pvz" — только точки Ozon
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    if (type === "pvz") {
      // Только пункты Ozon (из OSM), обычные адреса не показываем.
      const suggestions = await fromNominatim(q, true);
      return NextResponse.json({ suggestions });
    }

    // Обычные адреса (курьер и т.п.): DaData, иначе Nominatim
    const token = await getIntegration("dadata_token");
    let suggestions = token ? await fromDaData(q, token) : [];
    if (suggestions.length === 0) suggestions = await fromNominatim(q, false);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("GET /api/geo/suggest error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
