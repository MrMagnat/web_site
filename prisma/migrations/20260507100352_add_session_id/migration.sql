-- AlterTable
ALTER TABLE "SiteVisit" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "SiteVisit_sessionId_idx" ON "SiteVisit"("sessionId");
