# Feature: PRO (premium)

## Benefícios (negócio)

- Ver **carteiras completas** no ranking (sem blur onde aplicável).
- **Premiação anual melhor** — prêmio em dinheiro em **dobro** para top 3, com regra de **assinatura PRO ativa há ≥ 3 meses** antes do encerramento (detalhes em [RANKING-COMPETICAO.md](./RANKING-COMPETICAO.md) e UI “Como funciona”).
- Acesso aos **rankings qualitativos** (ações e FIIs).
- Visualização de **períodos anteriores** (conforme copy “Como funciona”).

## Freemium

- Competição e postagens em geral liberadas; **posts que revelam compras/vendas de terceiros** podem aparecer **borrados** sem PRO.

## Implementação (pistas)

- `User.isPremium`, `Subscription` no Prisma; verificação em componentes de carteira e checkout.
- Documentação de checkout: [CHECKOUT-E-CAKTO.md](./CHECKOUT-E-CAKTO.md).
