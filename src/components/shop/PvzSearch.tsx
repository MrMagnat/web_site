"use client";
import { useState, useRef, useEffect } from "react";

/**
 * Подсказки адреса для пункта выдачи. Используем Photon (photon.komoot.io) —
 * autocomplete-геокодер на данных OpenStreetMap: ищет по части слова,
 * ранжирует варианты, без API-ключа. Фильтруем по России.
 */
interface PhotonFeature {
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    locality?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
    type?: string;
  };
}

function buildAddress(p: PhotonFeature["properties"]): string {
  const cityLike = p.city ?? p.locality ?? p.district ?? "";
  const streetLike = [p.street, p.housenumber].filter(Boolean).join(", ");
  const namePart = p.name && p.name !== p.street ? p.name : "";
  return [cityLike, streetLike || namePart, p.state]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(", ");
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function PvzSearch({ value, onChange, error }: Props) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      // lat/lon — приоритет к центру РФ; lang=ru; больше лимит для разных вариантов
      const url =
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
        `&lang=ru&limit=12&lat=55.75&lon=37.62`;
      const res = await fetch(url, { signal: ctrl.signal });
      const data = await res.json();
      const feats: PhotonFeature[] = (data.features ?? []).filter(
        (f: PhotonFeature) => f.properties?.countrycode === "RU"
      );
      const seen = new Set<string>();
      const uniq = feats.filter((f) => {
        const a = buildAddress(f.properties);
        if (!a || seen.has(a)) return false;
        seen.add(a);
        return true;
      });
      setResults(uniq.slice(0, 8));
      setOpen(uniq.length > 0);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (f: PhotonFeature) => {
    const addr = buildAddress(f.properties);
    setQuery(addr);
    onChange(addr);
    setOpen(false);
    setResults([]);
  };

  useEffect(() => {
    if (value === "") setQuery("");
  }, [value]);

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-[11px] tracking-[0.16em] uppercase text-[#9a9a9a] mb-1.5">
        Пункт выдачи Ozon
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Город, улица, дом — начните вводить"
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

      {error && <p className="mt-1 text-[11px] text-[#3F1111]">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e8e0da] shadow-lg max-h-72 overflow-y-auto">
          {results.map((f, i) => {
            const addr = buildAddress(f.properties);
            return (
              <li key={`${f.properties.osm_id ?? i}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(f); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F7F0EC] transition-colors border-b border-[#f0ebe6] last:border-0"
                >
                  <p className="text-[13px] text-[#191E1B] leading-snug">{addr}</p>
                  {f.properties.postcode && (
                    <p className="text-[11px] text-[#9a9a9a] mt-0.5">{f.properties.postcode}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e8e0da] shadow-lg px-4 py-3">
          <p className="text-[13px] text-[#9a9a9a]">Ничего не найдено — уточните запрос</p>
        </div>
      )}

      <p className="mt-1.5 text-[11px] text-[#9a9a9a]">
        Введите адрес рядом с нужным ПВЗ — поиск работает по части слова
      </p>
    </div>
  );
}
