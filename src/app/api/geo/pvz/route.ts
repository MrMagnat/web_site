import { NextRequest, NextResponse } from "next/server";
import { getAllPvz, getPvzInfo } from "@/lib/ozonPvz";

/**
 * GET /api/geo/pvz?ll=lon,lat&spn=dlon,dlat  — пункты выдачи Ozon в области карты.
 *  Источник — официальный Seller API Ozon (полный список + адреса).
 *  Возвращаем ближайшие к центру точки (до 60) с адресами.
 *
 * Ответ: { points: [{ id, label, lat, lon }] }
 */
export async function GET(req: NextRequest) {
  try {
    const ll = req.nextUrl.searchParams.get("ll"); // "lon,lat"
    const spn = req.nextUrl.searchParams.get("spn"); // "dlon,dlat"
    if (!ll) return NextResponse.json({ points: [] });

    const [lonStr, latStr] = ll.split(",");
    const cLon = Number(lonStr), cLat = Number(latStr);
    if (!Number.isFinite(cLat) || !Number.isFinite(cLon)) {
      return NextResponse.json({ points: [] });
    }
    // полуразмах области (с запасом); если spn не задан — берём ~0.3°
    const [dLonStr, dLatStr] = (spn ?? "0.3,0.2").split(",");
    const dLon = Math.min(Math.max(Number(dLonStr) || 0.3, 0.02), 3) / 2;
    const dLat = Math.min(Math.max(Number(dLatStr) || 0.2, 0.02), 3) / 2;

    const all = await getAllPvz();
    if (all.length === 0) return NextResponse.json({ points: [], error: "Ozon API недоступен" });

    // фильтр по прямоугольнику области карты
    const inBox = all.filter(
      (p) => Math.abs(p.lat - cLat) <= dLat && Math.abs(p.lon - cLon) <= dLon
    );
    // ближайшие к центру — первые 60
    inBox.sort(
      (a, b) =>
        (a.lat - cLat) ** 2 + (a.lon - cLon) ** 2 - ((b.lat - cLat) ** 2 + (b.lon - cLon) ** 2)
    );
    const near = inBox.slice(0, 60);

    const info = await getPvzInfo(near.map((p) => p.id));
    const points = near.map((p) => ({
      id: String(p.id),
      label: info[p.id]?.address || "Пункт выдачи Ozon",
      lat: p.lat,
      lon: p.lon,
    }));

    return NextResponse.json({ points });
  } catch (error) {
    console.error("GET /api/geo/pvz error:", error);
    return NextResponse.json({ points: [] });
  }
}
