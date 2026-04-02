# Schema do banco (PostgreSQL / Prisma)

Fonte de verdade: `prisma/schema.prisma` e migrations em `prisma/migrations/`.

## Visão geral

- **Provider:** PostgreSQL (`DIRECT_DATABASE_URL`).
- **ORM:** Prisma 6.

## Entidades principais (por domínio)

### Usuários e assinatura

- **User** — vínculo com Supabase (`authUserId`), perfil, `isPremium`, slug, estatísticas de engajamento.
- **Subscription** — assinatura; campos legados **Kiwify** (`kiwifyId`, `kiwifyOrderId`) podem existir até migração para Cakto apenas.

### Carteira e ranking

- **Transaction** — compras/vendas por usuário (ticker, tipo, quantidade, preço, data, moeda opcional).
- **RankingCalculation** — snapshots de ranking calculados (JSON).
- **PriceUpdateCheckpoint** — processamento incremental de preços/rankings.
- **UserPerpetualProfitability** — rentabilidade perpétua agregada.
- **UserRankingHistory** — histórico de posição por período.
- **UserMedal** — medalhas por período.
- **MedalSettlement** — controle de apuração de medalhas.

### Referência e qualitativos

- **BrunoPortfolio** / **BrunoPortfolioAsset** — carteira de referência “Bruno”.
- **GGBRanking** / **FIIRanking** — caches de rankings qualitativos (scores em JSON).

### Feed social

- **FeedPost**, **FeedComment**, **FeedLike**, **FeedTimeline**, **FeedView**, **FeedPoll**, **FeedPollVote**.

### Social

- **UserFollow**, **UserBlock**, **UserStats**.

### Notificações

- **Notification**, **NotificationMessageVariation**.

### Marketing / conversão

- **Lead**, **ConversionEvent**, **FeedBanner** e relacionados (impressões, cliques, conversões).

### Filas e webhooks

- **ActionQueue** — jobs internos.
- **KiwifyWebhookQueue** — legado; alinhar remoção com migração de pagamentos.

### Push

- **PushSubscription**, **PushNotificationLog**, **PushNotificationPreferences**.

## Relações

- **User** é o centro da maioria das relações (1:N com transações, posts, notificações, etc.).
- **Transaction** pode ligar-se a **FeedPost** quando a operação gera post.

Para detalhes de campos e índices, abrir o `schema.prisma` correspondente a cada `model`.
