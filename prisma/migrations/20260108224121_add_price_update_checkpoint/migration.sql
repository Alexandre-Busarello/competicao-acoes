-- CreateTable
CREATE TABLE "PriceUpdateCheckpoint" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "processedUserIds" TEXT[],
    "monthlyRankings" JSONB,
    "annualRankings" JSONB,
    "pricesLastUpdate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PriceUpdateCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceUpdateCheckpoint_status_idx" ON "PriceUpdateCheckpoint"("status");

-- CreateIndex
CREATE INDEX "PriceUpdateCheckpoint_updatedAt_idx" ON "PriceUpdateCheckpoint"("updatedAt");
