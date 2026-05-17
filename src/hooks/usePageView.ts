"use client";
import { useEffect } from "react";

const SESSION_KEY = "af_session";
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 часа в мс

interface Session {
  id: string;
  startedAt: number;   // timestamp первого захода
  page: string;        // первая страница сессии
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s: Session = JSON.parse(raw);
    // Сессия протухла — удаляем
    if (Date.now() - s.startedAt > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function writeSession(s: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {/* silent */}
}

export function usePageView() {
  useEffect(() => {
    const existing = readSession();

    // Если сессия активна (< 2 ч) — ничего не пишем
    if (existing) return;

    // Новая сессия: читаем UTM из текущего URL
    const params = new URLSearchParams(window.location.search);
    const utmSource   = params.get("utm_source")   ?? undefined;
    const utmMedium   = params.get("utm_medium")   ?? undefined;
    const utmCampaign = params.get("utm_campaign") ?? undefined;
    const page = window.location.pathname;

    const session: Session = {
      id: generateId(),
      startedAt: Date.now(),
      page,
      utmSource,
      utmMedium,
      utmCampaign,
    };
    writeSession(session);

    // Пишем только один раз за сессию
    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page,
        sessionId: session.id,
        utmSource,
        utmMedium,
        utmCampaign,
      }),
    }).catch(() => {/* silent */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // [] — только при первом монте компонента (один раз за загрузку страницы)
          // Повторные навигации внутри SPA не пересоздают Navbar → эффект не перезапускается
}
