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

async function fromPhoton(q: string): Promise<Suggestion[]> {
  try {
    const url =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
      `&lang=ru&limit=12&lat=55.75&lon=37.62`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feats = (data.features ?? []).filter((f: any) => f.properties?.countrycode === "RU");
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const f of feats) {
      const p = f.properties;
      const city = p.city ?? p.locality ?? p.district ?? "";
      const street = [p.street, p.housenumber].filter(Boolean).join(", ");
      const name = p.name && p.name !== p.street ? p.name : "";
      const label = [city, street || name, p.state]
        .filter(Boolean)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
        .join(", ");
      if (label && !seen.has(label)) {
        seen.add(label);
        out.push({ label, detail: p.postcode });
      }
    }
    return out.slice(0, 8);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const token = await getIntegration("dadata_token");
    const suggestions = token ? await fromDaData(q, token) : await fromPhoton(q);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("GET /api/geo/suggest error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
