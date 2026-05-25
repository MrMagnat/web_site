"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
    _pvzSelect?: (addr: string) => void;
  }
}

interface OsmElement {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.L) { resolve(); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

async function fetchPvz(lat: number, lon: number): Promise<OsmElement[]> {
  const r = 20000; // 20 km radius
  const query = `
    [out:json][timeout:25];
    (
      node["brand"~"^[Оо]zon$|^OZON$"](around:${r},${lat},${lon});
      node["operator"~"[Оо]zon|OZON"](around:${r},${lat},${lon});
      node["name"~"[Оо]zon|OZON"](around:${r},${lat},${lon});
    );
    out body;
  `.trim();

  const res = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    { signal: AbortSignal.timeout(20000) }
  );
  const data = await res.json();
  return (data.elements ?? []) as OsmElement[];
}

function buildAddress(pt: OsmElement): string {
  const tags = pt.tags;
  const street = tags["addr:street"] ?? "";
  const house  = tags["addr:housenumber"] ?? "";
  const city   = tags["addr:city"] ?? tags["addr:place"] ?? "";
  const name   = tags["name"] ?? tags["brand"] ?? "Ozon ПВЗ";

  const streetPart = [street, house].filter(Boolean).join(", ");
  const addrPart   = [city, streetPart].filter(Boolean).join(", ");
  return addrPart || name;
}

interface Props {
  onSelect: (address: string) => void;
}

export default function PvzMap({ onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "empty" | "error">("loading");
  const [cityInput, setCityInput] = useState("");

  async function initMap(lat: number, lon: number) {
    if (!containerRef.current) return;

    // Destroy old instance if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    setStatus("loading");

    try {
      await loadLeaflet();
      const L = window.L;

      const map = L.map(containerRef.current).setView([lat, lon], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Blue Ozon marker
      const ozonIcon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:30px;border-radius:50%;background:#005BFF;border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;
          justify-content:center;color:#fff;font-size:11px;font-weight:700;font-family:sans-serif">О</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18],
      });

      const points = await fetchPvz(lat, lon);

      if (points.length === 0) {
        setStatus("empty");
      } else {
        setStatus("ok");
      }

      window._pvzSelect = (addr: string) => {
        onSelect(addr);
        map.closePopup();
      };

      for (const pt of points) {
        const addr = buildAddress(pt);
        const safeAddr = addr.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

        L.marker([pt.lat, pt.lon], { icon: ozonIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:180px;padding:2px 0">
              <p style="font-size:13px;font-weight:600;margin:0 0 4px;color:#191E1B">Ozon ПВЗ</p>
              <p style="font-size:12px;color:#666;margin:0 0 10px;line-height:1.4">${addr}</p>
              <button
                onclick="window._pvzSelect('${safeAddr}')"
                style="background:#005BFF;color:#fff;border:none;padding:7px 0;border-radius:6px;
                  cursor:pointer;font-size:12px;width:100%;font-weight:500"
              >Выбрать этот ПВЗ</button>
            </div>`,
            { maxWidth: 220 }
          );
      }

      // Add user location marker
      L.circleMarker([lat, lon], {
        radius: 7,
        color: "#3F1111",
        fillColor: "#3F1111",
        fillOpacity: 0.8,
        weight: 2,
      }).addTo(map).bindPopup("Вы здесь");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    // Try geolocation, default to Moscow
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
        () => initMap(55.7522, 37.6156), // Moscow
        { timeout: 6000 }
      );
    } else {
      initMap(55.7522, 37.6156);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      delete window._pvzSelect;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    // Geocode city via Nominatim (OpenStreetMap free geocoder)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1&countrycodes=ru`,
        { headers: { "Accept-Language": "ru" } }
      );
      const data = await res.json();
      if (data[0]) {
        initMap(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="border border-[#e8e0da] overflow-hidden">
      {/* City search bar */}
      <form
        onSubmit={handleCitySearch}
        className="flex gap-0 border-b border-[#e8e0da]"
      >
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Введите город для поиска ПВЗ…"
          className="flex-1 px-4 py-2.5 text-[13px] outline-none bg-[#FAFAFA]"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#005BFF] text-white text-[12px] tracking-wide hover:bg-[#0047cc] transition-colors whitespace-nowrap"
        >
          Найти
        </button>
      </form>

      {/* Status overlay */}
      {status === "loading" && (
        <div className="flex items-center justify-center h-[350px] bg-[#F7F0EC]">
          <p className="text-[13px] text-[#9a9a9a] animate-pulse">Загрузка карты…</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center justify-center h-[350px] bg-[#F7F0EC]">
          <p className="text-[13px] text-[#9a9a9a]">Не удалось загрузить карту. Введите адрес ПВЗ вручную.</p>
        </div>
      )}

      {/* Map container (always rendered so Leaflet has a DOM node) */}
      <div
        ref={containerRef}
        style={{ height: 350 }}
        className={status === "loading" || status === "error" ? "hidden" : ""}
      />

      {/* Empty state hint */}
      {status === "empty" && (
        <p className="text-[12px] text-[#9a9a9a] px-4 py-2 bg-[#F7F0EC] border-t border-[#e8e0da]">
          В этом районе ПВЗ не найдены. Попробуйте другой город или введите адрес вручную.
        </p>
      )}

      <p className="text-[11px] text-[#9a9a9a] px-4 py-2 border-t border-[#e8e0da] bg-[#FAFAFA]">
        Нажмите на синюю точку → «Выбрать этот ПВЗ»
      </p>
    </div>
  );
}
