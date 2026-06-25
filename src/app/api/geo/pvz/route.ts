import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geo/pvz?q=<город/район>  — пункты выдачи Ozon с координатами (для карты).
 *
 * Источник — OpenStreetMap (через Nominatim, серверный прокси): ищем POI «Озон/Ozon».
 * Возвращаем только реальные точки Ozon с координатами для меток на карте.
 *
 * Ответ: { points: [{ id, label, lat, lon }] }
 */
interface PvzPoint { id: string; label: string; lat: number; lon: number }

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ points: [] });

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent("Озон " + q)}` +
      `&format=jsonv2&addressdetails=1&namedetails=1&limit=40&countrycodes=ru&accept-language=ru`;
    const res = await fetch(url, {
      headers: { "User-Agent": "andruafamil.ru (pvz map)", "Accept-Language": "ru" },
    });
    if (!res.ok) return NextResponse.json({ points: [] });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    const seen = new Set<string>();
    const points: PvzPoint[] = [];

    for (const r of data) {
      const name: string = r.name || r.namedetails?.name || "";
      const hay = `${name} ${r.display_name ?? ""}`.toLowerCase();
      if (!/озон|ozon/.test(hay)) continue; // только точки Ozon

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

    return NextResponse.json({ points: points.slice(0, 30) });
  } catch (error) {
    console.error("GET /api/geo/pvz error:", error);
    return NextResponse.json({ points: [] });
  }
}
