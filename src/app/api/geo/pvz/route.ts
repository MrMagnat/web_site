import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

/**
 * GET /api/geo/pvz — пункты выдачи Ozon с координатами (для карты).
 *
 * Параметры (любой из):
 *   ll=lon,lat & spn=dlon,dlat — область карты (предпочтительно)
 *   q=город/район              — текстовый поиск
 *
 * Источник:
 *   1) Яндекс «Поиск по организациям» (если задан ключ yandex_search_api_key) —
 *      полный и точный список точек Ozon как организаций.
 *   2) OSM/Nominatim — запасной (что есть в открытой карте).
 *
 * Ответ: { points: [{ id, label, lat, lon }] }
 */
interface PvzPoint { id: string; label: string; lat: number; lon: number }

async function fromYandex(params: { ll?: string; spn?: string; q?: string }, key: string): Promise<PvzPoint[]> {
  const u = new URL("https://search-maps.yandex.ru/v1/");
  u.searchParams.set("apikey", key);
  u.searchParams.set("text", "Ozon Пункт выдачи");
  u.searchParams.set("type", "biz");
  u.searchParams.set("lang", "ru_RU");
  u.searchParams.set("results", "50");
  if (params.ll) u.searchParams.set("ll", params.ll);
  if (params.spn) u.searchParams.set("spn", params.spn);
  else if (params.q) u.searchParams.set("text", `Ozon Пункт выдачи ${params.q}`);

  const res = await fetch(u.toString());
  if (!res.ok) return [];
  const data = await res.json();
  const feats = data.features ?? [];
  const out: PvzPoint[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const f of feats as any[]) {
    const name: string = f.properties?.name ?? "";
    const addr: string = f.properties?.description ?? f.properties?.CompanyMetaData?.address ?? "";
    const hay = `${name}`.toLowerCase();
    if (!/озон|ozon/.test(hay)) continue; // только Ozon
    const coords = f.geometry?.coordinates; // [lon, lat]
    if (!Array.isArray(coords)) continue;
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    out.push({ id: String(f.properties?.CompanyMetaData?.id ?? `${lat},${lon}`), label: addr || name, lat, lon });
  }
  return out;
}

async function fromNominatim(q: string): Promise<PvzPoint[]> {
  if (q.length < 2) return [];
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent("Озон " + q)}` +
      `&format=jsonv2&addressdetails=1&namedetails=1&limit=40&countrycodes=ru&accept-language=ru`;
    const res = await fetch(url, {
      headers: { "User-Agent": "andruafamil.ru (pvz map)", "Accept-Language": "ru" },
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    const seen = new Set<string>();
    const points: PvzPoint[] = [];
    for (const r of data) {
      const name: string = r.name || r.namedetails?.name || "";
      const hay = `${name} ${r.display_name ?? ""}`.toLowerCase();
      if (!/озон|ozon/.test(hay)) continue;
      const lat = Number(r.lat);
      const lon = Number(r.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const a = r.address ?? {};
      const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? "";
      const street = [a.road, a.house_number].filter(Boolean).join(", ");
      const label = [city, street].filter(Boolean).join(", ") || (r.display_name as string) || name;
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      points.push({ id: String(r.place_id ?? key), label, lat, lon });
    }
    return points.slice(0, 30);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const ll = req.nextUrl.searchParams.get("ll") ?? undefined;
  const spn = req.nextUrl.searchParams.get("spn") ?? undefined;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  try {
    const ykey = await getIntegration("yandex_search_api_key");
    if (ykey && (ll || q)) {
      const points = await fromYandex({ ll, spn, q }, ykey);
      if (points.length) return NextResponse.json({ points });
    }
    // запасной источник
    const points = q ? await fromNominatim(q) : [];
    return NextResponse.json({ points });
  } catch (error) {
    console.error("GET /api/geo/pvz error:", error);
    return NextResponse.json({ points: [] });
  }
}
