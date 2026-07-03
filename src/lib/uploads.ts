import { unlink } from "fs/promises";
import path from "path";

/**
 * Удаляет локальный загруженный файл по URL вида /uploads/....
 * Внешние ссылки (http..., CDN Ozon и т.п.) и пустые значения игнорируются.
 * Ошибки (файла нет) — молча проглатываются.
 */
export async function deleteLocalUpload(url?: string | null): Promise<void> {
  if (!url || typeof url !== "string") return;
  if (!url.startsWith("/uploads/")) return; // только наши локальные файлы
  const rel = url.replace(/^\/uploads\//, "");
  if (!rel || rel.includes("..")) return;   // защита от выхода за пределы
  try {
    const abs = path.join(process.cwd(), "public", "uploads", rel);
    await unlink(abs);
  } catch {
    /* нет файла или уже удалён — не мешаем */
  }
}
