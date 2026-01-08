-- CreateTable
CREATE TABLE "RankingCalculation" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rankingData" JSONB NOT NULL,
    "totalParticipants" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RankingCalculation_period_calculatedAt_idx" ON "RankingCalculation"("period", "calculatedAt");

-- CreateIndex
CREATE INDEX "RankingCalculation_calculatedAt_idx" ON "RankingCalculation"("calculatedAt");
