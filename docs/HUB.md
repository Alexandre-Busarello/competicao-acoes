# Documentação — índice (Spec-Driven Design)

Este diretório é a **fonte de verdade** para produto, regras de negócio, arquitetura e integrações. Alterações de comportamento devem ser refletidas aqui **antes** ou **junto** com o código.

## Produto

- [Visão geral](./produto/OVERVIEW.md) — o que é, para quem, regras de jogo em alto nível
- [Monetização](./business/MONETIZATION.md) — freemium, PRO, checkout

## Tecnologia

- [Arquitetura](./tech/ARCHITECTURE.md) — estado atual no repositório e direção alvo (Clean Architecture)
- [Schema do banco](./tech/DATABASE-SCHEMA.md) — modelo Prisma / PostgreSQL
- [Integração Supabase](./tech/INTEGRACAO-SUPABASE.md) — auth e banco hospedado
- [Integração Cakto](./tech/INTEGRACAO-CAKTO.md) — pagamentos (ativo)
- [Integração Yahoo Finance](./tech/INTEGRACAO-YAHOO-FINANCE.md) — cotações nas transações
- [Web Push](./tech/INTEGRACAO-WEB-PUSH.md) — notificações PWA

## Referência de arquitetura alvo

- [arch-reference.md](./arch-reference.md) — padrão de camadas (Domain / Application / Infrastructure) e inversão de dependências para refatorações futuras

## Features (comportamento documentado)

| Área | Documento |
|------|-----------|
| Ranking e competição | [RANKING-COMPETICAO.md](./features/RANKING-COMPETICAO.md) |
| Carteira e transações | [CARTEIRA-TRANSACOES.md](./features/CARTEIRA-TRANSACOES.md) |
| Feed social | [FEED-SOCIAL.md](./features/FEED-SOCIAL.md) |
| Perfil e relacionamentos | [PERFIL-E-SEGUIR.md](./features/PERFIL-E-SEGUIR.md) |
| Notificações e push | [NOTIFICACOES-E-PUSH.md](./features/NOTIFICACOES-E-PUSH.md) |
| PRO / premium | [PRO-PREMIUM.md](./features/PRO-PREMIUM.md) |
| Checkout e Cakto | [CHECKOUT-E-CAKTO.md](./features/CHECKOUT-E-CAKTO.md) |
| Rankings qualitativos (ações / FIIs) | [RANKINGS-QUALITATIVOS.md](./features/RANKINGS-QUALITATIVOS.md) |
| Admin | [ADMIN.md](./features/ADMIN.md) |
| Autenticação | [AUTENTICACAO.md](./features/AUTENTICACAO.md) |
| Carteira Bruno | [CARTEIRA-BRUNO.md](./features/CARTEIRA-BRUNO.md) |

## Desenvolvimento

- [ROADMAP](./development/ROADMAP.md) — versão ativa e planejamento
- [v1.0.0 — onboarding Spec-Driven](./development/V1.0.0-SPEC-DRIVEN-ONBOARDING.md) — snapshot e tarefas imediatas

## Copy oficial “Como funciona”

A página **Como funciona** no app (`src/app/como-funciona/ComoFuncionaContent.tsx`) detalha rentabilidade, desempates, premiação, moeda e regras operacionais. Em caso de divergência com este repositório de docs, **atualizar os dois** para ficarem alinhados.
