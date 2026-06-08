-- Collections (product groups, like categories)
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

ALTER TABLE "Product" ADD COLUMN "collectionId" TEXT;

ALTER TABLE "Product" ADD CONSTRAINT "Product_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
