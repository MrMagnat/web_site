"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Выбор пункта выдачи Ozon на Яндекс.Картах (JS API v2.1).
 * Ключ берётся с сервера (/api/geo/maps-key). Метки — точки Ozon (/api/geo/pvz).
 * Клик по метке → выбор пункта.
 *
 * Если ключ Яндекс.Карт не задан в админке — показываем список выбора
 * (чтобы оформление не ломалось) и подсказку добавить ключ.
 */
interface PvzPoint { id: string; label: string; lat: number; lon: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { ymaps?: any } }

let ymapsLoader: Promise<unknown> | null = null;
function loadYmaps(key: string): Promise<unknown> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.ymaps) return Promise.resolve(window.ymaps);
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
  const [searched, setSearched] = useState(false);
  const [mapKey, setMapKey] = useState<string | null>(null); // null=загружается, ""=нет ключа
  const [mapReady, setMapReady] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 1. Получаем ключ
  useEffect(() => {
    fetch("/api/geo/maps-key")
      .then((r) => r.json())
      .then((d) => setMapKey(d.key ?? ""))
      .catch(() => setMapKey(""));
  }, []);

  // 2. Инициализируем карту, когда есть ключ и контейнер
  useEffect(() => {
    if (!mapKey || mapReady) return;
    let cancelled = false;
    loadYmaps(mapKey).then((ymaps) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ym = ymaps as any;
      if (cancelled || !mapElRef.current || mapRef.current) return;
      mapRef.current = new ym.Map(mapElRef.current, {
        center: [55.751, 37.618],
        zoom: 9,
        controls: ["zoomControl", "geolocationControl"],
      });
      setMapReady(true);
    }).catch(() => {/* ключ неверный/не загрузился */});
    return () => { cancelled = true; };
  }, [mapKey, mapReady]);

  // 3. Рисуем метки при изменении точек
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.ymaps) return;
    const ym = window.ymaps;
    const map = mapRef.current;
    map.geoObjects.removeAll();
    if (points.length === 0) return;

    points.forEach((p) => {
      const pm = new ym.Placemark(
        [p.lat, p.lon],
        { balloonContentHeader: "Пункт выдачи Ozon", balloonContentBody: p.label },
        { preset: "islands#violetDotIcon" }
      );
      pm.events.add("click", () => onChangeRef.current(p.label));
      map.geoObjects.add(pm);
    });

    if (points.length === 1) {
      map.setCenter([points[0].lat, points[0].lon], 14);
    } else {
      const lats = points.map((p) => p.lat);
      const lons = points.map((p) => p.lon);
      map.setBounds(
        [
          [Math.min(...lats), Math.min(...lons)],
          [Math.max(...lats), Math.max(...lons)],
        ],
        { checkZoomRange: true, zoomMargin: 30 }
      );
    }
  }, [points, mapReady]);

  const search = useCallback(async (q: string) => {
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
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 500);
  };

  const noKey = mapKey === "";

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
          placeholder="Введите город или район — покажем пункты Ozon"
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

      {/* Карта Яндекса (если есть ключ) */}
      {!noKey && (
        <div ref={mapElRef} className="rounded-lg overflow-hidden border"
          style={{ borderColor: "#e8e0da", height: 340, background: "#eef0f1" }} />
      )}

      {/* Запасной список выбора, если карта без ключа */}
      {noKey && points.length > 0 && (
        <ul className="border border-[#e8e0da] divide-y divide-[#f0ebe6] max-h-64 overflow-y-auto">
          {points.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onChange(p.label)}
                className="w-full text-left px-4 py-2.5 hover:bg-[#F7F0EC] transition-colors">
                <span className="text-[13px] text-[#191E1B]">{p.label}</span>
                {value === p.label && <span className="text-[11px] text-[#3F1111] ml-2">✓ выбран</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-[11px] text-[#3F1111]">{error}</p>}

      {value && (
        <p className="mt-2 text-[12px]" style={{ color: "#191E1B" }}>
          Выбран пункт: <span className="font-medium">{value}</span>
        </p>
      )}
      {searched && points.length === 0 && !loading && (
        <p className="mt-2 text-[12px] text-[#9a9a9a]">Пункты Ozon здесь не найдены — уточните город/район</p>
      )}
      {noKey && (
        <p className="mt-2 text-[11px] text-[#9a9a9a]">
          Карта появится после добавления ключа Яндекс.Карт в Админке → Интеграции.
          Пока можно выбрать пункт из списка выше.
        </p>
      )}
      {!noKey && (
        <p className="mt-1.5 text-[11px] text-[#9a9a9a]">
          Найдите на карте удобный пункт Ozon и нажмите по метке → «Пункт выдачи Ozon»
        </p>
      )}
    </div>
  );
}
