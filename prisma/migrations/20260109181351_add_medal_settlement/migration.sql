-- CreateTable
CREATE TABLE "MedalSettlement" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedalSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedalSettlement_period_year_month_idx" ON "MedalSettlement"("period", "year", "month");

-- CreateIndex
CREATE INDEX "MedalSettlement_settledAt_idx" ON "MedalSettlement"("settledAt");

-- CreateIndex
CREATE UNIQUE INDEX "MedalSettlement_period_year_month_key" ON "MedalSettlement"("period", "year", "month");
