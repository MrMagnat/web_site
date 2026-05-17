-- AlterTable
ALTER TABLE "Return" ADD COLUMN "number" TEXT;
ALTER TABLE "Return" ADD COLUMN "returnMethod" TEXT NOT NULL DEFAULT 'DIRECT';
ALTER TABLE "Return" ADD COLUMN "customerName" TEXT;
ALTER TABLE "Return" ADD COLUMN "customerEmail" TEXT;

-- Backfill number for existing rows (use id prefix if any exist)
UPDATE "Return" SET "number" = 'RET-2026-' || LPAD(CAST(EXTRACT(EPOCH FROM "createdAt")::BIGINT % 10000 AS TEXT), 4, '0') || '-' || LEFT("id", 4) WHERE "number" IS NULL;

-- Make number NOT NULL and UNIQUE
ALTER TABLE "Return" ALTER COLUMN "number" SET NOT NULL;
CREATE UNIQUE INDEX "Return_number_key" ON "Return"("number");
