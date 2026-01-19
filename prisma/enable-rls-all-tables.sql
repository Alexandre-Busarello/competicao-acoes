-- ============================================
-- ROW LEVEL SECURITY (RLS) - TODAS AS TABELAS
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
-- - Todas as tabelas serão bloqueadas para acesso público
-- - Apenas Service ROLE (usado pelo Prisma no backend) pode acessar
-- - Service ROLE bypassa RLS automaticamente, então terá acesso total
-- - Nenhum usuário autenticado ou anônimo poderá acessar via API pública

-- ============================================
-- KIWIFY WEBHOOK QUEUE TABLE
-- ============================================
ALTER TABLE "KiwifyWebhookQueue" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kiwify webhooks are private" ON "KiwifyWebhookQueue";
CREATE POLICY "Kiwify webhooks are private"
ON "KiwifyWebhookQueue" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert kiwify webhooks" ON "KiwifyWebhookQueue";
CREATE POLICY "Only service role can insert kiwify webhooks"
ON "KiwifyWebhookQueue" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update kiwify webhooks" ON "KiwifyWebhookQueue";
CREATE POLICY "Only service role can update kiwify webhooks"
ON "KiwifyWebhookQueue" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete kiwify webhooks" ON "KiwifyWebhookQueue";
CREATE POLICY "Only service role can delete kiwify webhooks"
ON "KiwifyWebhookQueue" FOR DELETE
USING (false);

-- ============================================
-- PUSH SUBSCRIPTION TABLE
-- ============================================
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Push subscriptions are private" ON "PushSubscription";
CREATE POLICY "Push subscriptions are private"
ON "PushSubscription" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert push subscriptions" ON "PushSubscription";
CREATE POLICY "Only service role can insert push subscriptions"
ON "PushSubscription" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update push subscriptions" ON "PushSubscription";
CREATE POLICY "Only service role can update push subscriptions"
ON "PushSubscription" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete push subscriptions" ON "PushSubscription";
CREATE POLICY "Only service role can delete push subscriptions"
ON "PushSubscription" FOR DELETE
USING (false);

-- ============================================
-- PUSH NOTIFICATION LOG TABLE
-- ============================================
ALTER TABLE "PushNotificationLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Push notification logs are private" ON "PushNotificationLog";
CREATE POLICY "Push notification logs are private"
ON "PushNotificationLog" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert push notification logs" ON "PushNotificationLog";
CREATE POLICY "Only service role can insert push notification logs"
ON "PushNotificationLog" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update push notification logs" ON "PushNotificationLog";
CREATE POLICY "Only service role can update push notification logs"
ON "PushNotificationLog" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete push notification logs" ON "PushNotificationLog";
CREATE POLICY "Only service role can delete push notification logs"
ON "PushNotificationLog" FOR DELETE
USING (false);

-- ============================================
-- PUSH NOTIFICATION PREFERENCES TABLE
-- ============================================
ALTER TABLE "PushNotificationPreferences" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Push notification preferences are private" ON "PushNotificationPreferences";
CREATE POLICY "Push notification preferences are private"
ON "PushNotificationPreferences" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert push notification preferences" ON "PushNotificationPreferences";
CREATE POLICY "Only service role can insert push notification preferences"
ON "PushNotificationPreferences" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update push notification preferences" ON "PushNotificationPreferences";
CREATE POLICY "Only service role can update push notification preferences"
ON "PushNotificationPreferences" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete push notification preferences" ON "PushNotificationPreferences";
CREATE POLICY "Only service role can delete push notification preferences"
ON "PushNotificationPreferences" FOR DELETE
USING (false);

-- ============================================
-- USER RANKING HISTORY TABLE
-- ============================================
ALTER TABLE "UserRankingHistory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User ranking history is private" ON "UserRankingHistory";
CREATE POLICY "User ranking history is private"
ON "UserRankingHistory" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert user ranking history" ON "UserRankingHistory";
CREATE POLICY "Only service role can insert user ranking history"
ON "UserRankingHistory" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update user ranking history" ON "UserRankingHistory";
CREATE POLICY "Only service role can update user ranking history"
ON "UserRankingHistory" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete user ranking history" ON "UserRankingHistory";
CREATE POLICY "Only service role can delete user ranking history"
ON "UserRankingHistory" FOR DELETE
USING (false);

-- ============================================
-- NOTIFICATION MESSAGE VARIATION TABLE
-- ============================================
ALTER TABLE "NotificationMessageVariation" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notification message variations are private" ON "NotificationMessageVariation";
CREATE POLICY "Notification message variations are private"
ON "NotificationMessageVariation" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert notification message variations" ON "NotificationMessageVariation";
CREATE POLICY "Only service role can insert notification message variations"
ON "NotificationMessageVariation" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update notification message variations" ON "NotificationMessageVariation";
CREATE POLICY "Only service role can update notification message variations"
ON "NotificationMessageVariation" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete notification message variations" ON "NotificationMessageVariation";
CREATE POLICY "Only service role can delete notification message variations"
ON "NotificationMessageVariation" FOR DELETE
USING (false);

-- ============================================
-- FEED BANNER TABLE
-- ============================================
ALTER TABLE "FeedBanner" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed banners are private" ON "FeedBanner";
CREATE POLICY "Feed banners are private"
ON "FeedBanner" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed banners" ON "FeedBanner";
CREATE POLICY "Only service role can insert feed banners"
ON "FeedBanner" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed banners" ON "FeedBanner";
CREATE POLICY "Only service role can update feed banners"
ON "FeedBanner" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed banners" ON "FeedBanner";
CREATE POLICY "Only service role can delete feed banners"
ON "FeedBanner" FOR DELETE
USING (false);

-- ============================================
-- FEED BANNER IMPRESSION TABLE
-- ============================================
ALTER TABLE "FeedBannerImpression" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed banner impressions are private" ON "FeedBannerImpression";
CREATE POLICY "Feed banner impressions are private"
ON "FeedBannerImpression" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed banner impressions" ON "FeedBannerImpression";
CREATE POLICY "Only service role can insert feed banner impressions"
ON "FeedBannerImpression" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed banner impressions" ON "FeedBannerImpression";
CREATE POLICY "Only service role can update feed banner impressions"
ON "FeedBannerImpression" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed banner impressions" ON "FeedBannerImpression";
CREATE POLICY "Only service role can delete feed banner impressions"
ON "FeedBannerImpression" FOR DELETE
USING (false);

-- ============================================
-- FEED BANNER CLICK TABLE
-- ============================================
ALTER TABLE "FeedBannerClick" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed banner clicks are private" ON "FeedBannerClick";
CREATE POLICY "Feed banner clicks are private"
ON "FeedBannerClick" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed banner clicks" ON "FeedBannerClick";
CREATE POLICY "Only service role can insert feed banner clicks"
ON "FeedBannerClick" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed banner clicks" ON "FeedBannerClick";
CREATE POLICY "Only service role can update feed banner clicks"
ON "FeedBannerClick" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed banner clicks" ON "FeedBannerClick";
CREATE POLICY "Only service role can delete feed banner clicks"
ON "FeedBannerClick" FOR DELETE
USING (false);

-- ============================================
-- FEED BANNER CONVERSION TABLE
-- ============================================
ALTER TABLE "FeedBannerConversion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed banner conversions are private" ON "FeedBannerConversion";
CREATE POLICY "Feed banner conversions are private"
ON "FeedBannerConversion" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed banner conversions" ON "FeedBannerConversion";
CREATE POLICY "Only service role can insert feed banner conversions"
ON "FeedBannerConversion" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed banner conversions" ON "FeedBannerConversion";
CREATE POLICY "Only service role can update feed banner conversions"
ON "FeedBannerConversion" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed banner conversions" ON "FeedBannerConversion";
CREATE POLICY "Only service role can delete feed banner conversions"
ON "FeedBannerConversion" FOR DELETE
USING (false);

-- ============================================
-- TABELAS QUE JÁ TÊM RLS MAS SEM POLÍTICAS EXPLÍCITAS
-- Adicionando políticas para garantir bloqueio total
-- ============================================

-- ============================================
-- USER PERPETUAL PROFITABILITY TABLE
-- ============================================
ALTER TABLE "UserPerpetualProfitability" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User perpetual profitability is private" ON "UserPerpetualProfitability";
CREATE POLICY "User perpetual profitability is private"
ON "UserPerpetualProfitability" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert user perpetual profitability" ON "UserPerpetualProfitability";
CREATE POLICY "Only service role can insert user perpetual profitability"
ON "UserPerpetualProfitability" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update user perpetual profitability" ON "UserPerpetualProfitability";
CREATE POLICY "Only service role can update user perpetual profitability"
ON "UserPerpetualProfitability" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete user perpetual profitability" ON "UserPerpetualProfitability";
CREATE POLICY "Only service role can delete user perpetual profitability"
ON "UserPerpetualProfitability" FOR DELETE
USING (false);

-- ============================================
-- FEED POST TABLE
-- ============================================
ALTER TABLE "FeedPost" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed posts are private" ON "FeedPost";
CREATE POLICY "Feed posts are private"
ON "FeedPost" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed posts" ON "FeedPost";
CREATE POLICY "Only service role can insert feed posts"
ON "FeedPost" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed posts" ON "FeedPost";
CREATE POLICY "Only service role can update feed posts"
ON "FeedPost" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed posts" ON "FeedPost";
CREATE POLICY "Only service role can delete feed posts"
ON "FeedPost" FOR DELETE
USING (false);

-- ============================================
-- FEED COMMENT TABLE
-- ============================================
ALTER TABLE "FeedComment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed comments are private" ON "FeedComment";
CREATE POLICY "Feed comments are private"
ON "FeedComment" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed comments" ON "FeedComment";
CREATE POLICY "Only service role can insert feed comments"
ON "FeedComment" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed comments" ON "FeedComment";
CREATE POLICY "Only service role can update feed comments"
ON "FeedComment" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed comments" ON "FeedComment";
CREATE POLICY "Only service role can delete feed comments"
ON "FeedComment" FOR DELETE
USING (false);

-- ============================================
-- FEED LIKE TABLE
-- ============================================
ALTER TABLE "FeedLike" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed likes are private" ON "FeedLike";
CREATE POLICY "Feed likes are private"
ON "FeedLike" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed likes" ON "FeedLike";
CREATE POLICY "Only service role can insert feed likes"
ON "FeedLike" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed likes" ON "FeedLike";
CREATE POLICY "Only service role can update feed likes"
ON "FeedLike" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed likes" ON "FeedLike";
CREATE POLICY "Only service role can delete feed likes"
ON "FeedLike" FOR DELETE
USING (false);

-- ============================================
-- USER FOLLOW TABLE
-- ============================================
ALTER TABLE "UserFollow" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User follows are private" ON "UserFollow";
CREATE POLICY "User follows are private"
ON "UserFollow" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert user follows" ON "UserFollow";
CREATE POLICY "Only service role can insert user follows"
ON "UserFollow" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update user follows" ON "UserFollow";
CREATE POLICY "Only service role can update user follows"
ON "UserFollow" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete user follows" ON "UserFollow";
CREATE POLICY "Only service role can delete user follows"
ON "UserFollow" FOR DELETE
USING (false);

-- ============================================
-- USER STATS TABLE
-- ============================================
ALTER TABLE "UserStats" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User stats are private" ON "UserStats";
CREATE POLICY "User stats are private"
ON "UserStats" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert user stats" ON "UserStats";
CREATE POLICY "Only service role can insert user stats"
ON "UserStats" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update user stats" ON "UserStats";
CREATE POLICY "Only service role can update user stats"
ON "UserStats" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete user stats" ON "UserStats";
CREATE POLICY "Only service role can delete user stats"
ON "UserStats" FOR DELETE
USING (false);

-- ============================================
-- USER BLOCK TABLE
-- ============================================
ALTER TABLE "UserBlock" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User blocks are private" ON "UserBlock";
CREATE POLICY "User blocks are private"
ON "UserBlock" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert user blocks" ON "UserBlock";
CREATE POLICY "Only service role can insert user blocks"
ON "UserBlock" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update user blocks" ON "UserBlock";
CREATE POLICY "Only service role can update user blocks"
ON "UserBlock" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete user blocks" ON "UserBlock";
CREATE POLICY "Only service role can delete user blocks"
ON "UserBlock" FOR DELETE
USING (false);

-- ============================================
-- NOTIFICATION TABLE
-- ============================================
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications are private" ON "Notification";
CREATE POLICY "Notifications are private"
ON "Notification" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert notifications" ON "Notification";
CREATE POLICY "Only service role can insert notifications"
ON "Notification" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update notifications" ON "Notification";
CREATE POLICY "Only service role can update notifications"
ON "Notification" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete notifications" ON "Notification";
CREATE POLICY "Only service role can delete notifications"
ON "Notification" FOR DELETE
USING (false);

-- ============================================
-- FEED TIMELINE TABLE
-- ============================================
ALTER TABLE "FeedTimeline" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed timeline is private" ON "FeedTimeline";
CREATE POLICY "Feed timeline is private"
ON "FeedTimeline" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed timeline" ON "FeedTimeline";
CREATE POLICY "Only service role can insert feed timeline"
ON "FeedTimeline" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed timeline" ON "FeedTimeline";
CREATE POLICY "Only service role can update feed timeline"
ON "FeedTimeline" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed timeline" ON "FeedTimeline";
CREATE POLICY "Only service role can delete feed timeline"
ON "FeedTimeline" FOR DELETE
USING (false);

-- ============================================
-- USER MEDAL TABLE
-- ============================================
ALTER TABLE "UserMedal" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User medals are private" ON "UserMedal";
CREATE POLICY "User medals are private"
ON "UserMedal" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert user medals" ON "UserMedal";
CREATE POLICY "Only service role can insert user medals"
ON "UserMedal" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update user medals" ON "UserMedal";
CREATE POLICY "Only service role can update user medals"
ON "UserMedal" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete user medals" ON "UserMedal";
CREATE POLICY "Only service role can delete user medals"
ON "UserMedal" FOR DELETE
USING (false);

-- ============================================
-- ACTION QUEUE TABLE
-- ============================================
ALTER TABLE "ActionQueue" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Action queue is private" ON "ActionQueue";
CREATE POLICY "Action queue is private"
ON "ActionQueue" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert action queue" ON "ActionQueue";
CREATE POLICY "Only service role can insert action queue"
ON "ActionQueue" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update action queue" ON "ActionQueue";
CREATE POLICY "Only service role can update action queue"
ON "ActionQueue" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete action queue" ON "ActionQueue";
CREATE POLICY "Only service role can delete action queue"
ON "ActionQueue" FOR DELETE
USING (false);

-- ============================================
-- ATUALIZANDO TABELAS QUE JÁ TÊM RLS
-- Removendo políticas antigas e bloqueando completamente
-- ============================================

-- ============================================
-- USER TABLE - Bloqueando acesso público
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Removendo todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own data" ON "User";
DROP POLICY IF EXISTS "Users can update own data" ON "User";
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "User";

-- Criando políticas que bloqueiam tudo
DROP POLICY IF EXISTS "Users are private" ON "User";
CREATE POLICY "Users are private"
ON "User" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert users" ON "User";
CREATE POLICY "Only service role can insert users"
ON "User" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update users" ON "User";
CREATE POLICY "Only service role can update users"
ON "User" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete users" ON "User";
CREATE POLICY "Only service role can delete users"
ON "User" FOR DELETE
USING (false);

-- ============================================
-- TRANSACTION TABLE - Bloqueando acesso público
-- ============================================
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- Removendo todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can create own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can update own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can delete own transactions" ON "Transaction";

-- Criando políticas que bloqueiam tudo
DROP POLICY IF EXISTS "Transactions are private" ON "Transaction";
CREATE POLICY "Transactions are private"
ON "Transaction" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert transactions" ON "Transaction";
CREATE POLICY "Only service role can insert transactions"
ON "Transaction" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update transactions" ON "Transaction";
CREATE POLICY "Only service role can update transactions"
ON "Transaction" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete transactions" ON "Transaction";
CREATE POLICY "Only service role can delete transactions"
ON "Transaction" FOR DELETE
USING (false);

-- ============================================
-- SUBSCRIPTION TABLE - Bloqueando acesso público
-- ============================================
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- Removendo todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own subscription" ON "Subscription";
DROP POLICY IF EXISTS "Allow insert for subscriptions" ON "Subscription";
DROP POLICY IF EXISTS "Allow update for subscriptions" ON "Subscription";

-- Criando políticas que bloqueiam tudo
DROP POLICY IF EXISTS "Subscriptions are private" ON "Subscription";
CREATE POLICY "Subscriptions are private"
ON "Subscription" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert subscriptions" ON "Subscription";
CREATE POLICY "Only service role can insert subscriptions"
ON "Subscription" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update subscriptions" ON "Subscription";
CREATE POLICY "Only service role can update subscriptions"
ON "Subscription" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete subscriptions" ON "Subscription";
CREATE POLICY "Only service role can delete subscriptions"
ON "Subscription" FOR DELETE
USING (false);

-- ============================================
-- LEAD TABLE - Já está bloqueado, mas garantindo
-- ============================================
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;

-- Removendo políticas antigas que permitiam INSERT/UPDATE
DROP POLICY IF EXISTS "Leads are private" ON "Lead";
DROP POLICY IF EXISTS "Allow insert for leads" ON "Lead";
DROP POLICY IF EXISTS "Allow update for leads" ON "Lead";

-- Criando políticas que bloqueiam tudo
DROP POLICY IF EXISTS "Leads are completely private" ON "Lead";
CREATE POLICY "Leads are completely private"
ON "Lead" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert leads" ON "Lead";
CREATE POLICY "Only service role can insert leads"
ON "Lead" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update leads" ON "Lead";
CREATE POLICY "Only service role can update leads"
ON "Lead" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete leads" ON "Lead";
CREATE POLICY "Only service role can delete leads"
ON "Lead" FOR DELETE
USING (false);

-- ============================================
-- BRUNO PORTFOLIO TABLE - Bloqueando acesso público
-- ============================================
ALTER TABLE "BrunoPortfolio" ENABLE ROW LEVEL SECURITY;

-- Removendo políticas antigas
DROP POLICY IF EXISTS "Bruno portfolio is public readable" ON "BrunoPortfolio";
DROP POLICY IF EXISTS "Only service role can modify Bruno portfolio" ON "BrunoPortfolio";
DROP POLICY IF EXISTS "Only service role can update Bruno portfolio" ON "BrunoPortfolio";

-- Criando políticas que bloqueiam tudo
DROP POLICY IF EXISTS "Bruno portfolio is private" ON "BrunoPortfolio";
CREATE POLICY "Bruno portfolio is private"
ON "BrunoPortfolio" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert bruno portfolio" ON "BrunoPortfolio";
CREATE POLICY "Only service role can insert bruno portfolio"
ON "BrunoPortfolio" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update bruno portfolio" ON "BrunoPortfolio";
CREATE POLICY "Only service role can update bruno portfolio"
ON "BrunoPortfolio" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete bruno portfolio" ON "BrunoPortfolio";
CREATE POLICY "Only service role can delete bruno portfolio"
ON "BrunoPortfolio" FOR DELETE
USING (false);

-- ============================================
-- BRUNO PORTFOLIO ASSET TABLE - Bloqueando acesso público
-- ============================================
ALTER TABLE "BrunoPortfolioAsset" ENABLE ROW LEVEL SECURITY;

-- Removendo políticas antigas
DROP POLICY IF EXISTS "Bruno portfolio assets are public readable" ON "BrunoPortfolioAsset";
DROP POLICY IF EXISTS "Only service role can modify Bruno portfolio assets" ON "BrunoPortfolioAsset";
DROP POLICY IF EXISTS "Only service role can update Bruno portfolio assets" ON "BrunoPortfolioAsset";

-- Criando políticas que bloqueiam tudo
DROP POLICY IF EXISTS "Bruno portfolio assets are private" ON "BrunoPortfolioAsset";
CREATE POLICY "Bruno portfolio assets are private"
ON "BrunoPortfolioAsset" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert bruno portfolio assets" ON "BrunoPortfolioAsset";
CREATE POLICY "Only service role can insert bruno portfolio assets"
ON "BrunoPortfolioAsset" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update bruno portfolio assets" ON "BrunoPortfolioAsset";
CREATE POLICY "Only service role can update bruno portfolio assets"
ON "BrunoPortfolioAsset" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete bruno portfolio assets" ON "BrunoPortfolioAsset";
CREATE POLICY "Only service role can delete bruno portfolio assets"
ON "BrunoPortfolioAsset" FOR DELETE
USING (false);

-- ============================================
-- RANKING CALCULATION TABLE - Bloqueando acesso público
-- ============================================
ALTER TABLE "RankingCalculation" ENABLE ROW LEVEL SECURITY;

-- Removendo políticas antigas
DROP POLICY IF EXISTS "Rankings are public readable" ON "RankingCalculation";
DROP POLICY IF EXISTS "Only service role can insert rankings" ON "RankingCalculation";
DROP POLICY IF EXISTS "Only service role can update rankings" ON "RankingCalculation";
DROP POLICY IF EXISTS "Only service role can delete rankings" ON "RankingCalculation";

-- Criando políticas que bloqueiam tudo
DROP POLICY IF EXISTS "Rankings are private" ON "RankingCalculation";
CREATE POLICY "Rankings are private"
ON "RankingCalculation" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert rankings" ON "RankingCalculation";
CREATE POLICY "Only service role can insert rankings"
ON "RankingCalculation" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update rankings" ON "RankingCalculation";
CREATE POLICY "Only service role can update rankings"
ON "RankingCalculation" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete rankings" ON "RankingCalculation";
CREATE POLICY "Only service role can delete rankings"
ON "RankingCalculation" FOR DELETE
USING (false);

-- ============================================
-- TABELAS QUE JÁ ESTÃO BLOQUEADAS
-- Garantindo que estão com RLS ativado e políticas corretas
-- ============================================

-- ============================================
-- PRICE UPDATE CHECKPOINT TABLE
-- ============================================
ALTER TABLE "PriceUpdateCheckpoint" ENABLE ROW LEVEL SECURITY;

-- Garantindo que todas as políticas estão bloqueadas
DROP POLICY IF EXISTS "Checkpoints are private" ON "PriceUpdateCheckpoint";
CREATE POLICY "Checkpoints are private"
ON "PriceUpdateCheckpoint" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert checkpoints" ON "PriceUpdateCheckpoint";
CREATE POLICY "Only service role can insert checkpoints"
ON "PriceUpdateCheckpoint" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update checkpoints" ON "PriceUpdateCheckpoint";
CREATE POLICY "Only service role can update checkpoints"
ON "PriceUpdateCheckpoint" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete checkpoints" ON "PriceUpdateCheckpoint";
CREATE POLICY "Only service role can delete checkpoints"
ON "PriceUpdateCheckpoint" FOR DELETE
USING (false);

-- ============================================
-- FEED VIEW TABLE
-- ============================================
ALTER TABLE "FeedView" ENABLE ROW LEVEL SECURITY;

-- Garantindo que todas as políticas estão bloqueadas
DROP POLICY IF EXISTS "FeedViews are private" ON "FeedView";
CREATE POLICY "FeedViews are private"
ON "FeedView" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert feed views" ON "FeedView";
CREATE POLICY "Only service role can insert feed views"
ON "FeedView" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update feed views" ON "FeedView";
CREATE POLICY "Only service role can update feed views"
ON "FeedView" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete feed views" ON "FeedView";
CREATE POLICY "Only service role can delete feed views"
ON "FeedView" FOR DELETE
USING (false);

-- ============================================
-- MEDAL SETTLEMENT TABLE
-- ============================================
ALTER TABLE "MedalSettlement" ENABLE ROW LEVEL SECURITY;

-- Garantindo que todas as políticas estão bloqueadas
DROP POLICY IF EXISTS "Medal settlements are private" ON "MedalSettlement";
CREATE POLICY "Medal settlements are private"
ON "MedalSettlement" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert medal settlements" ON "MedalSettlement";
CREATE POLICY "Only service role can insert medal settlements"
ON "MedalSettlement" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update medal settlements" ON "MedalSettlement";
CREATE POLICY "Only service role can update medal settlements"
ON "MedalSettlement" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete medal settlements" ON "MedalSettlement";
CREATE POLICY "Only service role can delete medal settlements"
ON "MedalSettlement" FOR DELETE
USING (false);

-- ============================================
-- FEED POLL TABLE
-- ============================================
ALTER TABLE "FeedPoll" ENABLE ROW LEVEL SECURITY;

-- Garantindo que todas as políticas estão bloqueadas
DROP POLICY IF EXISTS "Polls are private" ON "FeedPoll";
CREATE POLICY "Polls are private"
ON "FeedPoll" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert polls" ON "FeedPoll";
CREATE POLICY "Only service role can insert polls"
ON "FeedPoll" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update polls" ON "FeedPoll";
CREATE POLICY "Only service role can update polls"
ON "FeedPoll" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete polls" ON "FeedPoll";
CREATE POLICY "Only service role can delete polls"
ON "FeedPoll" FOR DELETE
USING (false);

-- ============================================
-- FEED POLL VOTE TABLE
-- ============================================
ALTER TABLE "FeedPollVote" ENABLE ROW LEVEL SECURITY;

-- Garantindo que todas as políticas estão bloqueadas
DROP POLICY IF EXISTS "Poll votes are private" ON "FeedPollVote";
CREATE POLICY "Poll votes are private"
ON "FeedPollVote" FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Only service role can insert poll votes" ON "FeedPollVote";
CREATE POLICY "Only service role can insert poll votes"
ON "FeedPollVote" FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Only service role can update poll votes" ON "FeedPollVote";
CREATE POLICY "Only service role can update poll votes"
ON "FeedPollVote" FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Only service role can delete poll votes" ON "FeedPollVote";
CREATE POLICY "Only service role can delete poll votes"
ON "FeedPollVote" FOR DELETE
USING (false);

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Todas as tabelas agora têm RLS ativado com políticas que bloqueiam
-- completamente o acesso público (SELECT, INSERT, UPDATE, DELETE).
--
-- Como funciona:
-- 1. Service ROLE (usado pelo Prisma no backend) bypassa RLS automaticamente
--    e tem acesso total a todas as tabelas
-- 2. Usuários autenticados e anônimos não podem acessar nenhuma tabela
--    diretamente via API pública
-- 3. Todas as operações devem passar pelo backend (API routes)
--
-- IMPORTANTE: Este script atualiza TODAS as tabelas, incluindo aquelas que
-- já tinham RLS com políticas permissivas. Agora todas estão completamente
-- bloqueadas para acesso público.
--
-- Para verificar se RLS está ativado em todas as tabelas, execute:
--
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity as rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename NOT LIKE '_prisma%'
-- ORDER BY tablename;
--
-- Todas devem retornar rls_enabled = true
--
-- Para verificar as políticas criadas, execute:
--
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

