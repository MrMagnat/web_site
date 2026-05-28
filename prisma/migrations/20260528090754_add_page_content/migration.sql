-- CreateTable
CREATE TABLE "PageContent" (
    "slug" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("slug")
);
