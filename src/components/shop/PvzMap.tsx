"use client";
import { useState, useRef, useEffect } from "react";

/**
 * Выбор пункта выдачи Ozon на Яндекс.Картах.
 * Точки грузятся ПО ВИДИМОЙ ОБЛАСТИ карты (двигаешь карту — видишь пункты рядом).
 * Источник точек — /api/geo/pvz (Яндекс «Поиск по организациям» или OSM).
 * Выбрать пункт можно кликом по метке ИЛИ по строке в списке под картой.
 */
interface PvzPoint { id: string; label: string; lat: number; lon: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { ymaps?: any } }

let ymapsLoader: Promise<unknown> | null = null;
function loadYmaps(key: string): Promise<unknown> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.ymaps?.Map) return Promise.resolve(window.ymaps);
  if (ymapsLoader) return ymapsLoader;
  ymapsLoader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key)}&lang=ru_RU`;
    s.async = true;
    s.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return ymapsLoader;
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
  const [mapKey, setMapKey] = useState<string | null>(null); // null=грузится, ""=нет ключа
  const [mapReady, setMapReady] = useState(false);

  const mapElRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  // 1. Ключ карты
  useEffect(() => {
    fetch("/api/geo/maps-key").then((r) => r.json()).then((d) => setMapKey(d.key ?? "")).catch(() => setMapKey(""));
  }, []);

  // Загрузка точек по текущей области карты
  const loadByMap = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: any = mapRef.current;
    if (!map) return;
    const c = map.getCenter();         // [lat, lon]
    const b = map.getBounds();         // [[swLat, swLon], [neLat, neLon]]
    const ll = `${c[1]},${c[0]}`;
    const spn = `${Math.abs(b[1][1] - b[0][1])},${Math.abs(b[1][0] - b[0][0])}`;
    fetchPoints(`/api/geo/pvz?ll=${ll}&spn=${spn}`);
  };

  const fetchPoints = async (url: string) => {
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      const data = await res.json();
      setPoints(data.points ?? []);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Инициализация карты
  useEffect(() => {
    if (!mapKey || mapReady) return;
    let cancelled = false;
    loadYmaps(mapKey).then((ymaps) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ym = ymaps as any;
      if (cancelled || !mapElRef.current || mapRef.current) return;
      const map = new ym.Map(mapElRef.current, {
        center: [55.751, 37.618],
        zoom: 10,
        controls: ["zoomControl", "geolocationControl"],
      });
      mapRef.current = map;
      // авто-загрузка точек при движении/зуме карты (с задержкой)
      map.events.add("boundschange", () => {
        if (loadTimer.current) clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(loadByMap, 600);
      });
      setMapReady(true);
      loadByMap(); // первая загрузка
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapKey, mapReady]);

  // 3. Метки
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.ymaps) return;
    const ym = window.ymaps;
    const map = mapRef.current;
    map.geoObjects.removeAll();
    points.forEach((p) => {
      const pm = new ym.Placemark(
        [p.lat, p.lon],
        { balloonContentHeader: "Пункт выдачи Ozon", balloonContentBody: p.label,
          balloonContentFooter: `<button onclick="window.__selectPvz && window.__selectPvz(${JSON.stringify(p.label)})" style="background:#3F1111;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Выбрать</button>` },
        { preset: "islands#violetDotIcon" }
      );
      pm.events.add("click", () => {
        // открываем балун; выбор — по кнопке в балуне или по списку
      });
      map.geoObjects.add(pm);
    });
  }, [points, mapReady]);

  // Глобальный коллбэк для кнопки в балуне
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__selectPvz = (label: string) => onChangeRef.current(label);
    return () => { try { delete (window as any).__selectPvz; } catch {} };
  }, []);

  // Поиск города → центрируем карту (точки догрузятся сами по boundschange)
  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    if (mapReady && window.ymaps) {
      window.ymaps.geocode(q, { results: 1 }).then((res: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = (res as any).geoObjects.get(0);
        if (obj && mapRef.current) mapRef.current.setCenter(obj.geometry.getCoordinates(), 12);
      });
    } else {
      // карты нет (нет ключа) — ищем списком через текстовый запрос
      fetchPoints(`/api/geo/pvz?q=${encodeURIComponent(q)}`);
    }
  };

  const selectPoint = (p: PvzPoint) => {
    onChange(p.label);
    if (mapRef.current) mapRef.current.setCenter([p.lat, p.lon], 15);
  };

  const noKey = mapKey === "";

  return (
    <div>
      <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">
        Пункт выдачи Ozon
      </label>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          placeholder="Ваш город или район"
          autoComplete="off"
          className={`flex-1 border px-4 py-3 text-[14px] bg-transparent outline-none transition-colors ${
            error ? "border-[#3F1111]" : "border-[#e8e0da] focus:border-[#191E1B]"
          }`}
        />
        <button type="button" onClick={handleSearch}
          className="px-5 bg-[#191E1B] text-white text-[12px] tracking-[0.12em] uppercase hover:bg-[#3F1111] transition-colors">
          Найти
        </button>
      </div>

      {!noKey && (
        <div ref={mapElRef} className="rounded-lg overflow-hidden border"
          style={{ borderColor: "#e8e0da", height: 320, background: "#eef0f1" }} />
      )}

      {/* Список найденных пунктов — простой выбор */}
      {points.length > 0 && (
        <div className="mt-3 border border-[#e8e0da] divide-y divide-[#f0ebe6] max-h-56 overflow-y-auto">
          <p className="px-4 py-2 text-[11px] tracking-[0.14em] uppercase text-[#9a9a9a] bg-[#F7F0EC]">
            Пункты Ozon рядом ({points.length})
          </p>
          {points.map((p) => (
            <button key={p.id} type="button" onClick={() => selectPoint(p)}
              className="w-full text-left px-4 py-2.5 hover:bg-[#F7F0EC] transition-colors flex items-center justify-between gap-3">
              <span className="text-[13px] text-[#191E1B]">{p.label}</span>
              {value === p.label
                ? <span className="text-[11px] text-[#3F1111] flex-shrink-0">✓ выбран</span>
                : <span className="text-[11px] text-[#9a9a9a] flex-shrink-0">выбрать</span>}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-[#3F1111]">{error}</p>}
      {value && (
        <p className="mt-2 text-[12px]" style={{ color: "#191E1B" }}>
          Выбран пункт: <span className="font-medium">{value}</span>
        </p>
      )}
      {loading && <p className="mt-2 text-[11px] text-[#9a9a9a]">Загружаем пункты…</p>}
      {!loading && points.length === 0 && (
        <p className="mt-2 text-[11px] text-[#9a9a9a]">
          Введите город и нажмите «Найти». Пункты Ozon появятся на карте и в списке.
        </p>
      )}
    </div>
  );
}
