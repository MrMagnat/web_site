"use client";
import { useState, useRef, useEffect } from "react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
  };
}

function buildShortAddress(r: NominatimResult): string {
  const a = r.address;
  const city = a.city ?? a.town ?? a.village ?? a.suburb ?? "";
  const street = [a.road, a.house_number].filter(Boolean).join(", ");
  return [city, street].filter(Boolean).join(", ") || r.display_name;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function PvzSearch({ value, onChange, error }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent("Ozon " + q)}&format=json&limit=7&countrycodes=ru&addressdetails=1`,
        { headers: { "Accept-Language": "ru" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // sync to parent even during typing

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 500);
  };

  const handleSelect = (r: NominatimResult) => {
    const addr = buildShortAddress(r);
    setQuery(addr);
    onChange(addr);
    setOpen(false);
    setResults([]);
  };

  // Keep query in sync if parent resets value
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
          placeholder="Например: Москва, Тверская"
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

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e8e0da] shadow-lg max-h-60 overflow-y-auto">
          {results.map((r) => {
            const short = buildShortAddress(r);
            return (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F7F0EC] transition-colors border-b border-[#f0ebe6] last:border-0"
                >
                  <p className="text-[13px] text-[#191E1B] leading-snug">{short}</p>
                  <p className="text-[11px] text-[#9a9a9a] mt-0.5 truncate">{r.display_name}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && query.length >= 2 && results.length === 0 && open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e8e0da] shadow-lg px-4 py-3">
          <p className="text-[13px] text-[#9a9a9a]">Пункты не найдены — попробуйте другой запрос</p>
        </div>
      )}

      <p className="mt-1.5 text-[11px] text-[#9a9a9a]">
        Введите город или улицу — подберём ближайшие ПВЗ Ozon
      </p>
    </div>
  );
}
