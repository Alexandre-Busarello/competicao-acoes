-- Step 1: Adicionar colunas como nullable primeiro
ALTER TABLE "RankingCalculation" ADD COLUMN "month" INTEGER;
ALTER TABLE "RankingCalculation" ADD COLUMN "year" INTEGER;

-- Step 2: Atualizar registros existentes baseado em calculatedAt
UPDATE "RankingCalculation"
SET 
  "year" = EXTRACT(YEAR FROM "calculatedAt")::INTEGER,
  "month" = CASE 
    WHEN "period" = 'mensal' THEN EXTRACT(MONTH FROM "calculatedAt")::INTEGER
    ELSE NULL
  END;

-- Step 3: Tornar year NOT NULL agora que todos os registros têm valor
ALTER TABLE "RankingCalculation" ALTER COLUMN "year" SET NOT NULL;

-- Step 4: Criar índice composto
CREATE INDEX "RankingCalculation_period_year_month_calculatedAt_idx" ON "RankingCalculation"("period", "year", "month", "calculatedAt");
