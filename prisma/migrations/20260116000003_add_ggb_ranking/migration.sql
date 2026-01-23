-- CreateTable
CREATE TABLE "GGBRanking" (
    "ticker" TEXT NOT NULL,
    "companyName" TEXT,
    "sector" TEXT,
    "industry" TEXT,
    "financialData" JSONB NOT NULL,
    "greenblattScore" DECIMAL(5,2),
    "grahamScore" DECIMAL(5,2),
    "bazinScore" DECIMAL(5,2),
    "finalScore" DECIMAL(5,2),
    "rank" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSource" TEXT,

    CONSTRAINT "GGBRanking_pkey" PRIMARY KEY ("ticker")
);

-- CreateIndex
CREATE INDEX "GGBRanking_finalScore_idx" ON "GGBRanking"("finalScore" DESC);

-- CreateIndex
CREATE INDEX "GGBRanking_rank_idx" ON "GGBRanking"("rank");

-- CreateIndex
CREATE INDEX "GGBRanking_lastUpdated_idx" ON "GGBRanking"("lastUpdated");

