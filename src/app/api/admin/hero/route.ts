import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";
import { deleteLocalUpload } from "@/lib/uploads";

// Ключи-файлы: при замене старый файл удаляем с сервера
const FILE_KEYS = ["hero_url", "banner_image"];

const ALL_KEYS = [
  "hero_type", "hero_url",
  "hero_tag", "hero_title", "hero_subtitle", "hero_cta_text", "hero_cta_link",
  "banner_image", "banner_tag", "banner_title_1", "banner_title_2",
  "banner_subtitle", "banner_cta",
] as const;

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.integration.findMany({
    where: { key: { in: [...ALL_KEYS] } },
  });
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const keysToUpdate = ALL_KEYS.filter((k) => body[k] !== undefined);

  // Для файловых ключей — узнаём старые значения, чтобы удалить заменённые файлы
  const fileKeysChanging = keysToUpdate.filter((k) => FILE_KEYS.includes(k));
  const oldRows = fileKeysChanging.length
    ? await prisma.integration.findMany({ where: { key: { in: fileKeysChanging } } })
    : [];
  const oldValues: Record<string, string> = {};
  for (const r of oldRows) oldValues[r.key] = r.value;

  const updates = keysToUpdate.map((k) =>
    prisma.integration.upsert({
      where: { key: k },
      create: { key: k, value: String(body[k]) },
      update: { value: String(body[k]) },
    })
  );
  if (updates.length) await prisma.$transaction(updates);

  // Удаляем старые файлы, если значение реально изменилось
  for (const k of fileKeysChanging) {
    const oldVal = oldValues[k];
    const newVal = String(body[k]);
    if (oldVal && oldVal !== newVal) await deleteLocalUpload(oldVal);
  }

  return NextResponse.json({ ok: true });
}
