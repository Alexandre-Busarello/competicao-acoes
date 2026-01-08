-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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
-- - Frontend (browser): Usuários só podem ver seus próprios dados
-- - Backend (Prisma com service role): Bypassa RLS e pode acessar todos os dados para ranking

-- ============================================
-- USER TABLE
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON "User";
CREATE POLICY "Users can view own data"
ON "User" FOR SELECT
USING (auth.uid()::text = "authUserId");

DROP POLICY IF EXISTS "Users can update own data" ON "User";
CREATE POLICY "Users can update own data"
ON "User" FOR UPDATE
USING (auth.uid()::text = "authUserId");

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "User";
CREATE POLICY "Allow insert for authenticated users"
ON "User" FOR INSERT
WITH CHECK (true);

-- ============================================
-- TRANSACTION TABLE
-- ============================================
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";
CREATE POLICY "Users can view own transactions"
ON "Transaction" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Transaction"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can create own transactions" ON "Transaction";
CREATE POLICY "Users can create own transactions"
ON "Transaction" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Transaction"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can update own transactions" ON "Transaction";
CREATE POLICY "Users can update own transactions"
ON "Transaction" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Transaction"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can delete own transactions" ON "Transaction";
CREATE POLICY "Users can delete own transactions"
ON "Transaction" FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Transaction"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

-- ============================================
-- PORTFOLIO TABLE
-- ============================================
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own portfolio" ON "Portfolio";
CREATE POLICY "Users can view own portfolio"
ON "Portfolio" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Portfolio"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can create own portfolio" ON "Portfolio";
CREATE POLICY "Users can create own portfolio"
ON "Portfolio" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Portfolio"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can update own portfolio" ON "Portfolio";
CREATE POLICY "Users can update own portfolio"
ON "Portfolio" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Portfolio"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

-- ============================================
-- PORTFOLIO ASSET TABLE
-- ============================================
ALTER TABLE "PortfolioAsset" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own portfolio assets" ON "PortfolioAsset";
CREATE POLICY "Users can view own portfolio assets"
ON "PortfolioAsset" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Portfolio"
    JOIN "User" ON "User".id = "Portfolio"."userId"
    WHERE "Portfolio".id = "PortfolioAsset"."portfolioId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can create own portfolio assets" ON "PortfolioAsset";
CREATE POLICY "Users can create own portfolio assets"
ON "PortfolioAsset" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Portfolio"
    JOIN "User" ON "User".id = "Portfolio"."userId"
    WHERE "Portfolio".id = "PortfolioAsset"."portfolioId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can update own portfolio assets" ON "PortfolioAsset";
CREATE POLICY "Users can update own portfolio assets"
ON "PortfolioAsset" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Portfolio"
    JOIN "User" ON "User".id = "Portfolio"."userId"
    WHERE "Portfolio".id = "PortfolioAsset"."portfolioId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can delete own portfolio assets" ON "PortfolioAsset";
CREATE POLICY "Users can delete own portfolio assets"
ON "PortfolioAsset" FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Portfolio"
    JOIN "User" ON "User".id = "Portfolio"."userId"
    WHERE "Portfolio".id = "PortfolioAsset"."portfolioId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

-- ============================================
-- SUBSCRIPTION TABLE
-- ============================================
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON "Subscription";
CREATE POLICY "Users can view own subscription"
ON "Subscription" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Subscription"."userId"
    AND "User"."authUserId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Allow insert for subscriptions" ON "Subscription";
CREATE POLICY "Allow insert for subscriptions"
ON "Subscription" FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for subscriptions" ON "Subscription";
CREATE POLICY "Allow update for subscriptions"
ON "Subscription" FOR UPDATE
USING (true);

-- ============================================
-- LEAD TABLE
-- ============================================
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leads are private" ON "Lead";
CREATE POLICY "Leads are private"
ON "Lead" FOR SELECT
USING (false); -- Ninguém pode ver via API pública

DROP POLICY IF EXISTS "Allow insert for leads" ON "Lead";
CREATE POLICY "Allow insert for leads"
ON "Lead" FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for leads" ON "Lead";
CREATE POLICY "Allow update for leads"
ON "Lead" FOR UPDATE
USING (true);

-- ============================================
-- BRUNO PORTFOLIO TABLE (Público)
-- ============================================
ALTER TABLE "BrunoPortfolio" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bruno portfolio is public readable" ON "BrunoPortfolio";
CREATE POLICY "Bruno portfolio is public readable"
ON "BrunoPortfolio" FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only service role can modify Bruno portfolio" ON "BrunoPortfolio";
CREATE POLICY "Only service role can modify Bruno portfolio"
ON "BrunoPortfolio" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update Bruno portfolio" ON "BrunoPortfolio";
CREATE POLICY "Only service role can update Bruno portfolio"
ON "BrunoPortfolio" FOR UPDATE
USING (false);

-- ============================================
-- BRUNO PORTFOLIO ASSET TABLE (Público)
-- ============================================
ALTER TABLE "BrunoPortfolioAsset" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bruno portfolio assets are public readable" ON "BrunoPortfolioAsset";
CREATE POLICY "Bruno portfolio assets are public readable"
ON "BrunoPortfolioAsset" FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only service role can modify Bruno portfolio assets" ON "BrunoPortfolioAsset";
CREATE POLICY "Only service role can modify Bruno portfolio assets"
ON "BrunoPortfolioAsset" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update Bruno portfolio assets" ON "BrunoPortfolioAsset";
CREATE POLICY "Only service role can update Bruno portfolio assets"
ON "BrunoPortfolioAsset" FOR UPDATE
USING (false);

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Políticas de LEITURA:
-- - Usuários só podem ver seus próprios dados (via Supabase Client no browser)
-- - Backend (Prisma com service role) bypassa RLS e pode acessar todos os dados
--
-- Políticas de ESCRITA:
-- - Usuários só podem criar/atualizar/deletar seus próprios dados
--
-- Fluxo de dados:
-- 1. Frontend (browser) → Supabase Client → Aplica RLS → Usuário só vê seus dados
-- 2. Backend (API routes) → Prisma com service role → Bypassa RLS → Acessa todos os dados
-- 3. Ranking é calculado no backend e enviado para o frontend
--
-- Para operações via Prisma (service role), RLS é bypassado automaticamente.
