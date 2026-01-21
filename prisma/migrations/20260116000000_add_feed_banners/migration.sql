-- CreateTable: FeedBanner
CREATE TABLE "FeedBanner" (
    "id" TEXT NOT NULL,
    "variation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefit" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FeedBannerImpression
CREATE TABLE "FeedBannerImpression" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "userId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedBannerImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FeedBannerClick
CREATE TABLE "FeedBannerClick" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "userId" TEXT,
    "leadId" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedBannerClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FeedBannerConversion
CREATE TABLE "FeedBannerConversion" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedBannerConversion_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Adicionar campos bannerClickId e bannerConversions ao Lead
ALTER TABLE "Lead" ADD COLUMN "bannerClickId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FeedBanner_variation_key" ON "FeedBanner"("variation");
CREATE INDEX "FeedBanner_variation_idx" ON "FeedBanner"("variation");
CREATE INDEX "FeedBanner_isActive_priority_idx" ON "FeedBanner"("isActive", "priority" DESC);

CREATE INDEX "FeedBannerImpression_bannerId_idx" ON "FeedBannerImpression"("bannerId");
CREATE INDEX "FeedBannerImpression_userId_idx" ON "FeedBannerImpression"("userId");
CREATE INDEX "FeedBannerImpression_viewedAt_idx" ON "FeedBannerImpression"("viewedAt");

CREATE INDEX "FeedBannerClick_bannerId_idx" ON "FeedBannerClick"("bannerId");
CREATE INDEX "FeedBannerClick_userId_idx" ON "FeedBannerClick"("userId");
CREATE INDEX "FeedBannerClick_leadId_idx" ON "FeedBannerClick"("leadId");
CREATE INDEX "FeedBannerClick_clickedAt_idx" ON "FeedBannerClick"("clickedAt");

CREATE INDEX "FeedBannerConversion_bannerId_idx" ON "FeedBannerConversion"("bannerId");
CREATE INDEX "FeedBannerConversion_userId_idx" ON "FeedBannerConversion"("userId");
CREATE INDEX "FeedBannerConversion_leadId_idx" ON "FeedBannerConversion"("leadId");
CREATE INDEX "FeedBannerConversion_convertedAt_idx" ON "FeedBannerConversion"("convertedAt");

CREATE UNIQUE INDEX "Lead_bannerClickId_key" ON "Lead"("bannerClickId");
CREATE UNIQUE INDEX "FeedBannerClick_leadId_key" ON "FeedBannerClick"("leadId");

-- AddForeignKey
ALTER TABLE "FeedBannerImpression" ADD CONSTRAINT "FeedBannerImpression_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "FeedBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeedBannerClick" ADD CONSTRAINT "FeedBannerClick_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "FeedBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedBannerClick" ADD CONSTRAINT "FeedBannerClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeedBannerClick" ADD CONSTRAINT "FeedBannerClick_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FeedBannerConversion" ADD CONSTRAINT "FeedBannerConversion_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "FeedBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedBannerConversion" ADD CONSTRAINT "FeedBannerConversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedBannerConversion" ADD CONSTRAINT "FeedBannerConversion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_bannerClickId_fkey" FOREIGN KEY ("bannerClickId") REFERENCES "FeedBannerClick"("id") ON DELETE SET NULL ON UPDATE CASCADE;




