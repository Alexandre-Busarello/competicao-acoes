# Feature: Carteira e transações

## Comportamento esperado

- **Minha carteira:** registro de compras e vendas (ticker, quantidade; preço obtido na execução — **Yahoo Finance**).
- **Transações irreversíveis** — não editar nem excluir; para sair de posição, venda a mercado.
- **Transações apenas no dia corrente** (sem datas retroativas) — conforme copy em `ComoFuncionaContent.tsx`.
- **Carteiras de outros usuários:** visualização conforme regras de PRO/blur (ver [PRO-PREMIUM.md](./PRO-PREMIUM.md)).

## Melhorias planejadas (produto)

- Na **própria carteira do usuário**, permitir **comprar ou vender mais** de um **ativo já posicionado**, com UX direta na carteira (tarefa no ROADMAP).

## Implementação (pistas)

- API: `src/app/api/transactions/*`, `carteira/*`, `ticker/validate`, serviços de dados financeiros e portfolio.
- Modelo: `Transaction` no Prisma.

## ⚠️ Alinhamento

Garantir que regras de “só hoje”, imutabilidade e fórmula de rentabilidade no backend coincidam com [RANKING-COMPETICAO.md](./RANKING-COMPETICAO.md) e com a UI “Como funciona”.
