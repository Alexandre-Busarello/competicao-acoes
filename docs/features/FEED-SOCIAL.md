# Feature: Feed social

## Comportamento

- Feed de posts ligados a operações e conteúdo social (curtidas, comentários, respostas, enquetes).
- Usuários veem atividade da comunidade; detalhes sensíveis de compra/venda de terceiros podem estar sujeitos a **blur** para não PRO (ver [PRO-PREMIUM.md](./PRO-PREMIUM.md)).

## Implementação (pistas)

- Páginas: `src/app/(main)/feed/*`.
- APIs: `src/app/api/feed/*`, `users/[userId]/feed`, posts por slug.
- Serviços: `src/lib/services/feed-service.ts`, `user-feed-service.ts`, `base-feed-service.ts`.
