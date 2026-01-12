-- ============================================
-- ROW LEVEL SECURITY (RLS) PARA RANKING E CHECKPOINT
-- ============================================
-- Execute este script diretamente no Supabase SQL Editor
-- Não execute via Prisma Migrate (o schema 'auth' não existe no shadow database)
--
-- Como executar:
-- 1. Acesse Supabase Dashboard > SQL Editor
-- 2. Cole este script completo
-- 3. Execute
--
-- IMPORTANTE:
-- - RankingCalculation: Público para leitura (todos podem ver rankings), apenas service role pode escrever
-- - PriceUpdateCheckpoint: Completamente privado (apenas service role pode acessar)

-- ============================================
-- RANKING CALCULATION TABLE (Público para leitura)
-- ============================================
ALTER TABLE "RankingCalculation" ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Todos podem ler rankings (público)
DROP POLICY IF EXISTS "Rankings are public readable" ON "RankingCalculation";
CREATE POLICY "Rankings are public readable"
ON "RankingCalculation" FOR SELECT
USING (true);

-- Política de inserção: Apenas service role pode inserir (via backend)
DROP POLICY IF EXISTS "Only service role can insert rankings" ON "RankingCalculation";
CREATE POLICY "Only service role can insert rankings"
ON "RankingCalculation" FOR INSERT
WITH CHECK (false); -- Bloqueado via API pública, apenas service role pode inserir

-- Política de atualização: Apenas service role pode atualizar (via backend)
DROP POLICY IF EXISTS "Only service role can update rankings" ON "RankingCalculation";
CREATE POLICY "Only service role can update rankings"
ON "RankingCalculation" FOR UPDATE
USING (false); -- Bloqueado via API pública, apenas service role pode atualizar

-- Política de exclusão: Apenas service role pode deletar (via backend)
DROP POLICY IF EXISTS "Only service role can delete rankings" ON "RankingCalculation";
CREATE POLICY "Only service role can delete rankings"
ON "RankingCalculation" FOR DELETE
USING (false); -- Bloqueado via API pública, apenas service role pode deletar

-- ============================================
-- PRICE UPDATE CHECKPOINT TABLE (Completamente privado)
-- ============================================
ALTER TABLE "PriceUpdateCheckpoint" ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Ninguém pode ler via API pública (apenas service role)
DROP POLICY IF EXISTS "Checkpoints are private" ON "PriceUpdateCheckpoint";
CREATE POLICY "Checkpoints are private"
ON "PriceUpdateCheckpoint" FOR SELECT
USING (false); -- Ninguém pode ver via API pública

-- Política de inserção: Apenas service role pode inserir (via backend)
DROP POLICY IF EXISTS "Only service role can insert checkpoints" ON "PriceUpdateCheckpoint";
CREATE POLICY "Only service role can insert checkpoints"
ON "PriceUpdateCheckpoint" FOR INSERT
WITH CHECK (false); -- Bloqueado via API pública, apenas service role pode inserir

-- Política de atualização: Apenas service role pode atualizar (via backend)
DROP POLICY IF EXISTS "Only service role can update checkpoints" ON "PriceUpdateCheckpoint";
CREATE POLICY "Only service role can update checkpoints"
ON "PriceUpdateCheckpoint" FOR UPDATE
USING (false); -- Bloqueado via API pública, apenas service role pode atualizar

-- Política de exclusão: Apenas service role pode deletar (via backend)
DROP POLICY IF EXISTS "Only service role can delete checkpoints" ON "PriceUpdateCheckpoint";
CREATE POLICY "Only service role can delete checkpoints"
ON "PriceUpdateCheckpoint" FOR DELETE
USING (false); -- Bloqueado via API pública, apenas service role pode deletar

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- RankingCalculation:
-- - Leitura: Pública (todos podem ver rankings via API pública)
-- - Escrita: Apenas service role (backend com Prisma)
--
-- PriceUpdateCheckpoint:
-- - Leitura: Privada (apenas service role)
-- - Escrita: Privada (apenas service role)
--
-- O backend (Prisma com service role) bypassa RLS automaticamente e pode
-- acessar/modificar todas as tabelas conforme necessário.




