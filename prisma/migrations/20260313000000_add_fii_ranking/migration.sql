-- CreateTable
CREATE TABLE "FIIRanking" (
    "ticker" TEXT NOT NULL,
    "fundName" TEXT,
    "segment" TEXT,
    "financialData" JSONB NOT NULL,
    "dyScore" DECIMAL(5,2),
    "pvpScore" DECIMAL(5,2),
    "vacancyScore" DECIMAL(5,2),
    "debtScore" DECIMAL(5,2),
    "payoutScore" DECIMAL(5,2),
    "liquidityScore" DECIMAL(5,2),
    "finalScore" DECIMAL(5,2),
    "rank" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSource" TEXT,

    CONSTRAINT "FIIRanking_pkey" PRIMARY KEY ("ticker")
);

-- CreateIndex
CREATE INDEX "FIIRanking_finalScore_idx" ON "FIIRanking"("finalScore" DESC);

-- CreateIndex
CREATE INDEX "FIIRanking_rank_idx" ON "FIIRanking"("rank");

-- CreateIndex
CREATE INDEX "FIIRanking_lastUpdated_idx" ON "FIIRanking"("lastUpdated");
