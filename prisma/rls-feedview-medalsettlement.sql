-- ============================================
-- ROW LEVEL SECURITY (RLS) PARA FEEDVIEW E MEDALSETTLEMENT
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
-- - FeedView: Completamente privado (apenas service role pode acessar)
-- - MedalSettlement: Completamente privado (apenas service role pode acessar)

-- ============================================
-- FEEDVIEW TABLE (Completamente privado)
-- ============================================
ALTER TABLE "FeedView" ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Ninguém pode ler via API pública (apenas service role)
DROP POLICY IF EXISTS "FeedViews are private" ON "FeedView";
CREATE POLICY "FeedViews are private"
ON "FeedView" FOR SELECT
USING (false); -- Ninguém pode ver via API pública

-- Política de inserção: Apenas service role pode inserir (via backend)
DROP POLICY IF EXISTS "Only service role can insert feed views" ON "FeedView";
CREATE POLICY "Only service role can insert feed views"
ON "FeedView" FOR INSERT
WITH CHECK (false); -- Bloqueado via API pública, apenas service role pode inserir

-- Política de atualização: Apenas service role pode atualizar (via backend)
DROP POLICY IF EXISTS "Only service role can update feed views" ON "FeedView";
CREATE POLICY "Only service role can update feed views"
ON "FeedView" FOR UPDATE
USING (false); -- Bloqueado via API pública, apenas service role pode atualizar

-- Política de exclusão: Apenas service role pode deletar (via backend)
DROP POLICY IF EXISTS "Only service role can delete feed views" ON "FeedView";
CREATE POLICY "Only service role can delete feed views"
ON "FeedView" FOR DELETE
USING (false); -- Bloqueado via API pública, apenas service role pode deletar

-- ============================================
-- MEDALSETTLEMENT TABLE (Completamente privado)
-- ============================================
ALTER TABLE "MedalSettlement" ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Ninguém pode ler via API pública (apenas service role)
DROP POLICY IF EXISTS "Medal settlements are private" ON "MedalSettlement";
CREATE POLICY "Medal settlements are private"
ON "MedalSettlement" FOR SELECT
USING (false); -- Ninguém pode ver via API pública

-- Política de inserção: Apenas service role pode inserir (via backend)
DROP POLICY IF EXISTS "Only service role can insert medal settlements" ON "MedalSettlement";
CREATE POLICY "Only service role can insert medal settlements"
ON "MedalSettlement" FOR INSERT
WITH CHECK (false); -- Bloqueado via API pública, apenas service role pode inserir

-- Política de atualização: Apenas service role pode atualizar (via backend)
DROP POLICY IF EXISTS "Only service role can update medal settlements" ON "MedalSettlement";
CREATE POLICY "Only service role can update medal settlements"
ON "MedalSettlement" FOR UPDATE
USING (false); -- Bloqueado via API pública, apenas service role pode atualizar

-- Política de exclusão: Apenas service role pode deletar (via backend)
DROP POLICY IF EXISTS "Only service role can delete medal settlements" ON "MedalSettlement";
CREATE POLICY "Only service role can delete medal settlements"
ON "MedalSettlement" FOR DELETE
USING (false); -- Bloqueado via API pública, apenas service role pode deletar

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- FeedView:
-- - Leitura: Privada (apenas service role)
-- - Escrita: Privada (apenas service role)
--
-- MedalSettlement:
-- - Leitura: Privada (apenas service role)
-- - Escrita: Privada (apenas service role)
--
-- O backend (Prisma com service role) bypassa RLS automaticamente e pode
-- acessar/modificar todas as tabelas conforme necessário.

