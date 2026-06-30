/**
 * Пункты выдачи Ozon через Seller API (официально, полный список).
 *  • v1/delivery/point/list  — все ПВЗ (id + координаты), кэшируем в памяти.
 *  • v1/delivery/point/info  — детали (адрес, город) по списку id (до 100 за раз).
 * Авторизация — те же Client-Id + Api-Key, что у Ozon Логистики (getOzonCreds).
 */
import { getOzonCreds } from "./integrations";

const BASE = "https://api-seller.ozon.ru";
const TTL = 12 * 60 * 60 * 1000; // полный список меняется редко — кэш 12 часов

export interface PvzCoord { id: number; lat: number; lon: number }
export interface PvzInfo { address: string; city: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cache: { at: number; pts: PvzCoord[] } | null = null;
let inflight: Promise<PvzCoord[]> | null = null;

async function headers() {
  const { clientId, apiKey } = await getOzonCreds();
  if (!clientId || !apiKey) return null;
  return { "Client-Id": clientId, "Api-Key": apiKey, "Content-Type": "application/json" };
}

/** Полный список ПВЗ (id + координаты), с кэшем в памяти. */
export async function getAllPvz(): Promise<PvzCoord[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.pts;
  if (inflight) return inflight;

  inflight = (async () => {
    const h = await headers();
    if (!h) return cache?.pts ?? [];
    try {
      const res = await fetch(`${BASE}/v1/delivery/point/list`, { method: "POST", headers: h, body: "{}" });
      if (!res.ok) return cache?.pts ?? [];
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pts: PvzCoord[] = (data.points ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => ({ id: p.map_point_id, lat: p.coordinate?.lat, lon: p.coordinate?.long }))
        .filter((p: PvzCoord) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
      cache = { at: Date.now(), pts };
      return pts;
    } catch {
      return cache?.pts ?? [];
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Детали (адрес/город) по списку id — батчами по 100. */
export async function getPvzInfo(ids: number[]): Promise<Record<number, PvzInfo>> {
  const out: Record<number, PvzInfo> = {};
  if (ids.length === 0) return out;
  const h = await headers();
  if (!h) return out;

  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    try {
      const res = await fetch(`${BASE}/v1/delivery/point/info`, {
        method: "POST", headers: h, body: JSON.stringify({ map_point_ids: batch }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of (data.points ?? []) as any[]) {
        const dm = p.delivery_method ?? {};
        const id = dm.map_point_id; // id лежит внутри delivery_method
        if (id == null) continue;
        out[id] = {
          address: dm.address ?? "",
          city: dm.address_details?.city ?? dm.address_details?.region ?? "",
        };
      }
    } catch { /* пропускаем сбойный батч */ }
  }
  return out;
}
