import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";
import { isAdmin } from "@/lib/adminAuth";

// Ключи, значения которых нужно маскировать в GET-ответах
const SENSITIVE_KEYS = ["secret", "password", "api_key", "token", "private"];

function isSensitive(key: string): boolean {
  const k = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => k.includes(s));
}

function maskValue(value: string): string {
  if (value.length <= 8) return "•••••••";
  return value.slice(0, 4) + "•••••••" + value.slice(-4);
}

// ─── GET — читаем все ключи (чувствительные — маскируем) ──────────────────────
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.integration.findMany({ orderBy: { key: "asc" } });

    const result: Record<string, string> = {};
    for (const row of rows) {
      // Расшифровываем для проверки наличия значения
      const plain = isEncrypted(row.value) ? (decrypt(row.value) ?? "") : row.value;

      // Чувствительные поля — только маска; обычные — открытым текстом
      result[row.key] = isSensitive(row.key) && plain ? maskValue(plain) : plain;
    }

    return NextResponse.json({ integrations: result });
  } catch (error) {
    console.error("GET /api/admin/integrations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST — сохраняем, чувствительные шифруем ─────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined || value === "") {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    // Шифруем чувствительные значения перед записью в БД
    const stored = isSensitive(key) ? encrypt(String(value)) : String(value);

    const row = await prisma.integration.upsert({
      where:  { key },
      update: { value: stored, updatedAt: new Date() },
      create: { key, value: stored },
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error) {
    console.error("POST /api/admin/integrations error:", error);
    // Частая причина — ENCRYPTION_KEY не задан
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
