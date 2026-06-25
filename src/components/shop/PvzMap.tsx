"use client";
import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Выбор пункта выдачи Ozon на карте (Leaflet + OpenStreetMap, без API-ключей).
 * Метки — реальные точки Ozon из OSM. Клик по метке → выбор пункта.
 */
interface PvzPoint { id: string; label: string; lat: number; lon: number }

// Иконка-маркер (без зависимости от картинок leaflet, чтобы не ломались пути в бандле)
const icon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#3F1111;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
});

function Recenter({ points }: { points: PvzPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 14);
    } else {
      map.fitBounds(points.map((p) => [p.lat, p.lon]) as [number, number][], { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function PvzMap({ value, onChange, error }: Props) {
  const [query, setQuery] = useState("");
  const [points, setPoints] = useState<PvzPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = async (q: string) => {
    if (q.trim().length < 2) { setPoints([]); setSearched(false); return; }
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(`/api/geo/pvz?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
      const data = await res.json();
      setPoints(data.points ?? []);
      setSearched(true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 500);
  };

  return (
    <div>
      <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">
        Пункт выдачи Ozon
      </label>

      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Введите город или район — покажем пункты Ozon на карте"
          autoComplete="off"
          className={`w-full border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors pr-10 ${
            error ? "border-[#3F1111]" : "border-[#e8e0da] focus:border-[#191E1B]"
          }`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </div>

      {/* Карта */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#e8e0da", height: 320 }}>
        <MapContainer center={[55.751, 37.618]} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <Recenter points={points} />
          {points.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lon]} icon={icon}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>{p.label}</p>
                  <button
                    type="button"
                    onClick={() => onChange(p.label)}
                    style={{ background: "#3F1111", color: "#fff", padding: "6px 12px", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 12 }}
                  >
                    {value === p.label ? "✓ Выбран" : "Выбрать этот пункт"}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {error && <p className="mt-1 text-[11px] text-[#3F1111]">{error}</p>}

      {value && (
        <p className="mt-2 text-[12px]" style={{ color: "#191E1B" }}>
          Выбран пункт: <span className="font-medium">{value}</span>
        </p>
      )}
      {searched && points.length === 0 && !loading && (
        <p className="mt-2 text-[12px] text-[#9a9a9a]">Пункты Ozon здесь не найдены — уточните город/район</p>
      )}
      <p className="mt-1.5 text-[11px] text-[#9a9a9a]">
        Найдите на карте удобный пункт Ozon и нажмите «Выбрать»
      </p>
    </div>
  );
}
