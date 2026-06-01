import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOzonCreds } from "@/lib/integrations";

function checkAdmin(req: NextRequest) {
  return (
    req.headers.get("x-admin-key") === "admin-authenticated" ||
    req.headers.get("x-admin") === "true"
  );
}

const OZON_BASE = "https://api-seller.ozon.ru";

async function ozonPost(
  endpoint: string,
  body: unknown,
  creds: { clientId: string; apiKey: string }
) {
  const res = await fetch(`${OZON_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Client-Id": creds.clientId,
      "Api-Key": creds.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Получить все product_id из Ozon (с пагинацией) */
async function fetchAllOzonProductIds(
  creds: { clientId: string; apiKey: string }
): Promise<number[]> {
  const ids: number[] = [];
  let lastId = "";

  while (true) {
    const data = await ozonPost("/v3/product/list", { filter: {}, last_id: lastId, limit: 100 }, creds);
    const items: Array<{ product_id: number }> = data?.result?.items ?? [];
    if (!items.length) break;
    ids.push(...items.map((i) => i.product_id));
    lastId = data?.result?.last_id ?? "";
    if (!lastId || items.length < 100) break;
  }

  return ids;
}

/** Получить детали по списку product_id (батч до 100) */
async function fetchProductDetails(
  productIds: number[],
  creds: { clientId: string; apiKey: string }
): Promise<OzonProduct[]> {
  const data = await ozonPost("/v3/product/info/list", { product_id: productIds }, creds);
  return data?.items ?? [];
}

/** Получить описание одного продукта */
async function fetchProductDescription(
  productId: number,
  creds: { clientId: string; apiKey: string }
): Promise<string> {
  try {
    const data = await ozonPost("/v1/product/info/description", { product_id: productId }, creds);
    const raw: string = data?.result?.description ?? "";
    // strip HTML tags
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

interface OzonProduct {
  id: number;
  offer_id: string;
  name: string;
  price: string;
  old_price: string;
  images: string[];
  primary_image: string[];
}

// ── GET — предпросмотр: сколько новых товаров будет импортировано ──────────────
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creds = await getOzonCreds();
  if (!creds.clientId || !creds.apiKey) {
    return NextResponse.json({ error: "Ozon API ключи не настроены" }, { status: 400 });
  }

  const allIds = await fetchAllOzonProductIds(creds as { clientId: string; apiKey: string });
  const details = await fetchProductDetails(allIds.slice(0, 100), creds as { clientId: string; apiKey: string });

  const offerIds = details.map((p) => p.offer_id);
  const existing = await prisma.product.findMany({
    where: { sku: { in: offerIds } },
    select: { sku: true },
  });
  const existingSkus = new Set(existing.map((p: { sku: string }) => p.sku));

  const toImport = details.filter((p: OzonProduct) => !existingSkus.has(p.offer_id));

  return NextResponse.json({
    total: allIds.length,
    toImport: toImport.length,
    alreadyExists: existingSkus.size,
  });
}

// ── POST — запустить импорт ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creds = await getOzonCreds();
  if (!creds.clientId || !creds.apiKey) {
    return NextResponse.json({ error: "Ozon API ключи не настроены" }, { status: 400 });
  }

  // Дефолтная категория — первая в базе
  const defaultCategory = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
  if (!defaultCategory) {
    return NextResponse.json({ error: "Нет ни одной категории. Создайте категорию сначала." }, { status: 400 });
  }

  const allIds = await fetchAllOzonProductIds(creds as { clientId: string; apiKey: string });
  if (!allIds.length) {
    return NextResponse.json({ imported: 0, skipped: 0, message: "Нет товаров в Ozon" });
  }

  // Детали батчами по 100
  const allDetails: OzonProduct[] = [];
  for (let i = 0; i < allIds.length; i += 100) {
    const batch = allIds.slice(i, i + 100);
    const details = await fetchProductDetails(batch, creds as { clientId: string; apiKey: string });
    allDetails.push(...details);
  }

  // Какие SKU уже есть
  const offerIds = allDetails.map((p) => p.offer_id);
  const existing = await prisma.product.findMany({
    where: { sku: { in: offerIds } },
    select: { sku: true },
  });
  const existingSkus = new Set(existing.map((p: { sku: string }) => p.sku));

  const toImport = allDetails.filter((p: OzonProduct) => !existingSkus.has(p.offer_id));

  let imported = 0;
  const errors: string[] = [];

  for (const p of toImport) {
    try {
      // Получаем описание
      const description = await fetchProductDescription(p.id, creds as { clientId: string; apiKey: string });

      // Цена: price = текущая цена, old_price = зачёркнутая
      const price = parseFloat(p.old_price) || parseFloat(p.price) || 0;
      const discountPrice =
        parseFloat(p.old_price) > parseFloat(p.price) ? parseFloat(p.price) : null;

      // Картинки: primary_image первая, потом остальные (без дублей)
      const primaryArr = Array.isArray(p.primary_image) ? p.primary_image : [p.primary_image].filter(Boolean);
      const allImgs = [...primaryArr, ...p.images.filter((u) => !primaryArr.includes(u))];

      await prisma.product.create({
        data: {
          sku:          p.offer_id,
          nameRu:       p.name,
          nameEn:       "",
          descriptionRu: description,
          descriptionEn: "",
          price,
          discountPrice,
          images:       allImgs,
          sizes:        [],
          colors:       [],
          specsRu:      {},
          specsEn:      {},
          isActive:     true,
          isNew:        false,
          isFeatured:   false,
          categoryId:   defaultCategory.id,
        },
      });

      imported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${p.offer_id}: ${msg}`);
    }
  }

  return NextResponse.json({
    imported,
    skipped: existingSkus.size,
    errors: errors.length ? errors : undefined,
    message: `Импортировано ${imported} из ${allDetails.length} товаров. Пропущено (уже есть): ${existingSkus.size}.`,
  });
}
