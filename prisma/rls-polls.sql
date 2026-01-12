-- ============================================
-- ROW LEVEL SECURITY (RLS) PARA FEEDPOLL E FEEDPOLLVOTE
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
-- - FeedPoll: Completamente privado (apenas service role pode acessar)
-- - FeedPollVote: Completamente privado (apenas service role pode acessar)
-- - Todas as operações devem passar pelo backend (APIs)
-- - Service role (usado pelo Prisma) bypassa RLS automaticamente

-- ============================================
-- FEEDPOLL TABLE (Completamente privado)
-- ============================================
ALTER TABLE "FeedPoll" ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Ninguém pode ler via API pública (apenas service role)
DROP POLICY IF EXISTS "Polls are private" ON "FeedPoll";
CREATE POLICY "Polls are private"
ON "FeedPoll" FOR SELECT
USING (false); -- Ninguém pode ver via API pública

-- Política de inserção: Apenas service role pode inserir (via backend)
DROP POLICY IF EXISTS "Only service role can insert polls" ON "FeedPoll";
CREATE POLICY "Only service role can insert polls"
ON "FeedPoll" FOR INSERT
WITH CHECK (false); -- Bloqueado via API pública, apenas service role pode inserir

-- Política de atualização: Apenas service role pode atualizar (via backend)
DROP POLICY IF EXISTS "Only service role can update polls" ON "FeedPoll";
CREATE POLICY "Only service role can update polls"
ON "FeedPoll" FOR UPDATE
USING (false); -- Bloqueado via API pública, apenas service role pode atualizar

-- Política de exclusão: Apenas service role pode deletar (via backend)
DROP POLICY IF EXISTS "Only service role can delete polls" ON "FeedPoll";
CREATE POLICY "Only service role can delete polls"
ON "FeedPoll" FOR DELETE
USING (false); -- Bloqueado via API pública, apenas service role pode deletar

-- ============================================
-- FEEDPOLLVOTE TABLE (Completamente privado)
-- ============================================
ALTER TABLE "FeedPollVote" ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Ninguém pode ler via API pública (apenas service role)
DROP POLICY IF EXISTS "Poll votes are private" ON "FeedPollVote";
CREATE POLICY "Poll votes are private"
ON "FeedPollVote" FOR SELECT
USING (false); -- Ninguém pode ver via API pública

-- Política de inserção: Apenas service role pode inserir (via backend)
DROP POLICY IF EXISTS "Only service role can insert poll votes" ON "FeedPollVote";
CREATE POLICY "Only service role can insert poll votes"
ON "FeedPollVote" FOR INSERT
WITH CHECK (false); -- Bloqueado via API pública, apenas service role pode inserir

-- Política de atualização: Apenas service role pode atualizar (via backend)
DROP POLICY IF EXISTS "Only service role can update poll votes" ON "FeedPollVote";
CREATE POLICY "Only service role can update poll votes"
ON "FeedPollVote" FOR UPDATE
USING (false); -- Bloqueado via API pública, apenas service role pode atualizar

-- Política de exclusão: Apenas service role pode deletar (via backend)
DROP POLICY IF EXISTS "Only service role can delete poll votes" ON "FeedPollVote";
CREATE POLICY "Only service role can delete poll votes"
ON "FeedPollVote" FOR DELETE
USING (false); -- Bloqueado via API pública, apenas service role pode deletar

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- FeedPoll:
-- - Leitura: Privada (apenas service role)
-- - Escrita: Privada (apenas service role)
-- - Atualização: Privada (apenas service role)
-- - Exclusão: Privada (apenas service role)
--
-- FeedPollVote:
-- - Leitura: Privada (apenas service role)
-- - Escrita: Privada (apenas service role)
-- - Atualização: Privada (apenas service role)
-- - Exclusão: Privada (apenas service role)
--
-- O backend (Prisma com service role) bypassa RLS automaticamente e pode
-- acessar/modificar todas as tabelas conforme necessário.
--
-- Todas as operações de enquete devem passar pelas APIs:
-- - POST /api/feed/[postId]/poll - Criar enquete
-- - GET /api/feed/poll/[pollId] - Buscar enquete
-- - POST /api/feed/poll/[pollId]/vote - Votar na enquete

