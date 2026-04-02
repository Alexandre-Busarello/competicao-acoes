# Feature: Checkout e pagamentos

## Ativo: Cakto

- Fluxo de assinatura **PRO** via **Cakto** (webhooks em `src/app/api/webhooks/cakto/`).

## Legado: Kiwify

- **Descontinuado** no negócio; o repositório ainda pode conter:
  - Rotas `webhooks/kiwify`, modelo `KiwifyWebhookQueue`, campos `kiwifyId` / `kiwifyOrderId` em `Subscription`.
- **Remoção** planejada como tarefa de versão — ver [../development/ROADMAP.md](../development/ROADMAP.md).

## ⚠️ Sincronização

Ao remover Kiwify, atualizar: este doc, [../business/MONETIZATION.md](../business/MONETIZATION.md), [../tech/DATABASE-SCHEMA.md](../tech/DATABASE-SCHEMA.md), regra `.cursor/rules/billing.mdc`.
