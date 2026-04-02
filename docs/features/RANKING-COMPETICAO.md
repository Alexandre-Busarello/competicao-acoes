# Feature: Ranking e competição

## Objetivo

Competir por **rentabilidade percentual**, independentemente do valor investido.

## Fonte de detalhes (copy oficial)

A página **Como funciona** (`src/app/como-funciona/ComoFuncionaContent.tsx`) é a referência para fórmulas, exemplos e premiação. Em divergência com o código, alinhar ambos.

## Resumo de regras (espelho do produto)

- **Atualização:** ranking recalculado periodicamente (copy: **a cada 15 minutos**) com preços de mercado.
- **Rentabilidade:** `((Valor Atual − Valor Investido) / Valor Investido) × 100%` — investido = compras; atual = posições + caixa de vendas.
- **Desempate:** (1) mais ativos distintos → (2) última transação mais recente → (3) conta mais antiga.
- **Dividendos:** apenas **ganho de capital** no ranking; proventos não entram automaticamente (reinvestimento manual).
- **Mensal:** zera no **primeiro dia do mês**; considera só operações do mês; **Top 3** = **medalhas**, sem prêmio em dinheiro.
- **Anual:** transações do ano; retorno **acumulado**; data de corte pode ser **flexível** (equipe comunica). **Top 3:** prêmios em **dinheiro** + medalhas (valores na UI: 1º R$ 300, 2º R$ 200, 3º R$ 100). **PRO em dobro** (R$ 600 / 400 / 200) com regra de **PRO ativo há pelo menos 3 meses** antes do encerramento anual.
- **Moeda:** equivalência **1:1** entre moedas no cálculo do ranking; **câmbio não** entra na rentabilidade.

## Implementação (pistas no código)

- APIs: `src/app/api/ranking/*`, `ranking/calculate`, `prices/update`, serviços em `src/lib/services/ranking-service.ts` e correlatos.
- Dados: `RankingCalculation`, `UserRankingHistory`, `UserMedal`, `MedalSettlement`, etc.

## Melhorias planejadas

- Ver [../development/ROADMAP.md](../development/ROADMAP.md).
