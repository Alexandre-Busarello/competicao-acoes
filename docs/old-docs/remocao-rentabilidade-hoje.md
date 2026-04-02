# Remoção da Rentabilidade "Hoje" e Correção do Retorno Anual

## Data: 09/01/2026

## Problemas Identificados

### Problema 1: Rentabilidade "Hoje" Mockada

A seção "Hoje" na página `/minha-carteira` estava exibindo uma rentabilidade calculada de forma mockada (10% da rentabilidade mensal), o que não refletia a variação real dos preços do dia. Como o sistema não possui histórico de preços ou valores anteriores da carteira, não era possível calcular a rentabilidade diária real.

### Problema 2: Retorno Anual Mostrando Valor Anualizado ao Invés de Acumulado

O valor anual exibido estava mostrando o retorno anualizado (projeção matemática) ao invés do retorno acumulado real, que é o mesmo valor exibido na aba anual do ranking. Isso causava inconsistência entre o que era mostrado na carteira e o que era mostrado no ranking anual.

### Cálculo Anterior (Mockado)

```typescript
const todayReturn = monthlyReturn * 0.1; // Mock - 10% do mensal
```

Este cálculo simplesmente multiplicava a rentabilidade mensal por 0.1, gerando um valor que não tinha relação com a variação real dos preços no dia.

## Solução Implementada

### 1. Remoção da Seção "Hoje"

Foi removida a seção "Hoje" que exibia rentabilidade mockada.

### 2. Correção do Retorno Anual

Foi corrigido o cálculo do retorno anual para usar o **retorno acumulado real** ao invés do retorno anualizado. Agora a tela mostra:

1. **Este Mês**: Rentabilidade mensal calculada pelo backend (do ranking mensal)
2. **Anual**: Retorno acumulado real desde o início do ano (do ranking anual)

### Diferença Entre Retorno Anualizado e Acumulado

- **Retorno Anualizado**: Projeção matemática do que seria o retorno se mantivesse a mesma performance por um ano
  - Exemplo: 0,13% em 1 dia → projetado para 63% ao ano (irreal)
  
- **Retorno Acumulado**: Retorno real desde o início do período (ano)
  - Exemplo: Investiu R$ 1000 em janeiro, hoje vale R$ 1100 → 10% acumulado (real)

### Mudanças Realizadas

#### Arquivo: `src/components/portfolio/PortfolioSummary.tsx`

1. **Removida a seção "Hoje"**:
   - Removida a variável `todayReturn` (cálculo mockado)
   - Removida a variável `isTodayPositive`
   - Removido o bloco de código que exibia a rentabilidade de hoje

2. **Correção do retorno anual**:
   - Agora busca **ambos os rankings** em paralelo:
     - Ranking mensal (`/api/ranking?period=mensal`) para obter `monthlyReturn` e `currentValue`
     - Ranking anual (`/api/ranking?period=anual`) para obter `annualReturn` acumulado real
   - O `annualReturn` agora vem do ranking anual, que contém o retorno acumulado real desde o início do ano
   - Adicionada variável `isAnnualPositive` para determinar a cor do indicador
   - Exibição formatada com ícone de tendência (TrendingUp/TrendingDown) e cores apropriadas

3. **Limpeza de código**:
   - Removidos imports não utilizados (`format` e `ptBR` do `date-fns`)
   - Removido import `useTransactionStore` que não estava sendo usado
   - Removida variável `transactions` não utilizada
   - Removida variável `portfolioLoading` não utilizada

### Estrutura Final

A tela agora exibe:

```
┌─────────────────────────────┐
│  💼 Saldo Atual              │
│  R$ X.XXX,XX                 │
│                              │
│  ┌──────────┬──────────┐    │
│  │Este Mês  │  Anual   │    │
│  │  +X.XX%  │  +X.XX%  │    │
│  └──────────┴──────────┘    │
└─────────────────────────────┘
```

### Dados Utilizados

Os dados são obtidos de **duas APIs em paralelo**:

1. **`/api/ranking?period=mensal`**:
   - `monthlyReturn`: Rentabilidade mensal calculada pelo backend
   - `currentValue`: Valor atual da carteira

2. **`/api/ranking?period=anual`**:
   - `annualReturn`: Retorno acumulado real desde o início do ano (não anualizado)

### Implementação Técnica

```typescript
// Buscar ambos os rankings em paralelo
const [monthlyResponse, annualResponse] = await Promise.all([
  fetch(`/api/ranking?period=mensal`),
  fetch(`/api/ranking?period=anual`),
]);

// Do ranking mensal: monthlyReturn e currentValue
// Do ranking anual: annualReturn (retorno acumulado real)
```

## Benefícios

1. **Dados Reais**: Apenas dados calculados corretamente pelo backend são exibidos
2. **Consistência**: O retorno anual exibido na carteira é o mesmo valor mostrado na aba anual do ranking
3. **Precisão**: Retorno anual mostra valor acumulado real, não uma projeção matemática
4. **Simplicidade**: Interface mais limpa e focada nas informações relevantes
5. **Manutenibilidade**: Código mais simples sem cálculos mockados
6. **Transparência**: Usuários veem retornos reais que realmente obtiveram, não projeções

## Arquivos Modificados

- `src/components/portfolio/PortfolioSummary.tsx`

## Observações Importantes

### Retorno Anual: Acumulado vs Anualizado

- **Ranking Anual**: Usa retorno **acumulado real** desde o início do ano
- **Ranking Mensal**: Usa retorno **anualizado/projetado** (para comparações e projeções)
- **Carteira**: Agora usa o mesmo retorno acumulado do ranking anual para consistência

### Rentabilidade Diária

Para implementar a rentabilidade diária real no futuro, seria necessário:

1. **Armazenar histórico de preços**: Manter preços de fechamento anterior de cada ativo
2. **Armazenar valor da carteira**: Salvar o valor total da carteira no fechamento anterior
3. **Calcular variação diária**: Comparar valor atual com valor de ontem
   ```
   Rentabilidade Hoje = ((Valor Hoje - Valor Ontem) / Valor Ontem) * 100
   ```

Atualmente, o sistema calcula apenas:
- **Rentabilidade Mensal**: Desde o início do mês
- **Rentabilidade Anual**: Retorno acumulado real desde o início do ano (ou primeira transação, se mais recente)

