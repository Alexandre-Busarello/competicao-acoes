-- =====================================================
-- Script para habilitar RLS (Row Level Security) em todas as tabelas
-- de perfil público, feed e medalhas
-- 
-- Este script garante que apenas o backend (via service role) possa
-- acessar essas tabelas diretamente, bloqueando acesso público
-- 
-- IMPORTANTE: Quando RLS está habilitado SEM políticas públicas,
-- apenas o service role (que ignora RLS) pode acessar.
-- Isso é exatamente o que queremos para segurança.
-- =====================================================

-- =====================================================
-- 1. UserPerpetualProfitability
-- =====================================================
ALTER TABLE "UserPerpetualProfitability" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. FeedPost
-- =====================================================
ALTER TABLE "FeedPost" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. FeedComment
-- =====================================================
ALTER TABLE "FeedComment" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. FeedLike
-- =====================================================
ALTER TABLE "FeedLike" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. UserFollow
-- =====================================================
ALTER TABLE "UserFollow" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. UserStats
-- =====================================================
ALTER TABLE "UserStats" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. UserBlock
-- =====================================================
ALTER TABLE "UserBlock" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. Notification
-- =====================================================
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. FeedTimeline
-- =====================================================
ALTER TABLE "FeedTimeline" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. UserMedal
-- =====================================================
ALTER TABLE "UserMedal" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. ActionQueue
-- =====================================================
ALTER TABLE "ActionQueue" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Ao habilitar RLS sem criar políticas públicas, o comportamento é:
-- - Service Role: Acesso total (ignora RLS)
-- - Anon/Authenticated Roles: Acesso bloqueado (sem políticas = bloqueio total)
-- 
-- Isso é exatamente o que queremos: apenas o backend (service role) pode acessar.
-- 
-- =====================================================
-- Verificação: Verificar se RLS está habilitado
-- =====================================================
-- Execute este comando para verificar se RLS está habilitado em todas as tabelas:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity as rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN (
--   'UserPerpetualProfitability',
--   'FeedPost',
--   'FeedComment',
--   'FeedLike',
--   'UserFollow',
--   'UserStats',
--   'UserBlock',
--   'Notification',
--   'FeedTimeline',
--   'UserMedal',
--   'ActionQueue'
-- )
-- ORDER BY tablename;
-- 
-- Todas devem retornar rls_enabled = true

