# Integração Cakto

## Status

**Meio de pagamento ativo** após descontinuação do Kiwify no negócio.

## Código

- Webhooks e rotas em `src/app/api/webhooks/cakto/` (incl. rota de teste se existir).

## Documentação de produto

- Fluxo de checkout e comportamento esperado: [../features/CHECKOUT-E-CAKTO.md](../features/CHECKOUT-E-CAKTO.md).

## Notas

- Manter este documento e o código **sincronizados** ao evoluir assinatura PRO e modelo `Subscription` no Prisma.
- Campos e filas **Kiwify** no schema são **legado** até remoção documentada na versão planejada.
