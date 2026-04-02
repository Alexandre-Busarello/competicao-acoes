# Ranking Anual: Retorno Acumulado vs Retorno Anualizado

## Data: 08/01/2026

## Problema Identificado

O ranking anual estava usando **retorno anualizado** (projeção matemática), quando deveria usar **retorno acumulado** (retorno real desde o início do ano).

### Diferença Conceitual

- **Retorno Anualizado**: Projeção matemática do que seria o retorno se mantivesse a mesma performance por um ano
  - Exemplo: 0,13% em 1 dia → projetado para 63% ao ano (irreal)
  
- **Retorno Acumulado**: Retorno real desde o início do período (ano)
  - Exemplo: Investiu R$ 1000 em janeiro, hoje vale R$ 1100 → 10% acumulado (real)

### Por que isso importa para ranking?

Para um **ranking competitivo anual**, o que importa é:
- Quem teve o **maior retorno real acumulado** desde o início do ano
- Não uma projeção matemática que pode distorcer resultados

## Solução Implementada

Foi modificada a função `calculateReturns()` para aceitar o período do ranking e calcular de forma diferente:

- **Período 'mensal'**: Usa retorno anualizado (projeção) - útil para comparações e projeções
- **Período 'anual'**: Usa retorno acumulado (real) - correto para ranking competitivo

### Mudanças Realizadas

#### 1. Nova Função: `calculateYearToDateReturn()`

Calcula o retorno acumulado desde o início do ano (ou desde a primeira transação se mais recente).

```typescript
export function calculateYearToDateReturn(
  currentValue: number,
  totalInvested: number,
  firstTransactionDate: Date
): number
```

**Características**:
- Retorna retorno **real acumulado**, não projeção
- Não aplica fórmulas de anualização
- Simplesmente calcula: `(valorAtual - valorInvestido) / valorInvestido * 100`

#### 2. Função `calculateReturns()` Modificada

Agora aceita o parâmetro `period`:

```typescript
export function calculateReturns(
  currentValue: number,
  totalInvested: number,
  firstTransactionDate: Date,
  period: 'mensal' | 'anual' = 'mensal'
): {
  monthlyReturn: number;
  annualReturn: number;
}
```

**Lógica**:
- Se `period === 'anual'`: Usa `calculateYearToDateReturn()` (retorno acumulado real)
- Se `period === 'mensal'`: Usa `calculateAnnualizedReturn()` (retorno anualizado/projetado)

#### 3. `ranking-service.ts` Atualizado

O método `calculateRanking()` agora passa o período para `calculateReturns()`:

```typescript
const { monthlyReturn, annualReturn } = calculateReturns(
  currentValue,
  totalInvested,
  firstTransactionDate,
  period // 'mensal' ou 'anual'
);
```

## Exemplos de Cálculo

### Cenário 1: Investimento de 1 dia (Ranking Anual)

**Dados**:
- Investiu: R$ 2.983
- Valor atual: R$ 2.987
- Retorno: 0,13%

**Antes (retorno anualizado)**:
- Cálculo: (1 + 0.0013)^(365/1) - 1 ≈ 63%
- ❌ Irreal e distorce o ranking

**Agora (retorno acumulado)**:
- Cálculo: (2987 - 2983) / 2983 * 100 = 0,13%
- ✅ Real e correto para ranking

### Cenário 2: Investimento desde janeiro (Ranking Anual)

**Dados**:
- Investiu em janeiro: R$ 10.000
- Valor atual: R$ 12.000
- Retorno acumulado: 20%

**Cálculo**:
- Retorno acumulado: (12000 - 10000) / 10000 * 100 = 20%
- ✅ Correto - mostra retorno real desde o início do ano

### Cenário 3: Ranking Mensal (continua usando anualizado)

**Dados**:
- Investiu há 10 dias: R$ 1.000
- Valor atual: R$ 1.050
- Retorno: 5%

**Cálculo**:
- Retorno anualizado: (1 + 0.05)^(365/10) - 1 ≈ 182%
- ✅ Correto para projeção/comparação mensal

## Arquivos Modificados

### 1. `src/lib/utils/portfolio-calculator.ts`

**Nova função**:
- `calculateYearToDateReturn()`: Calcula retorno acumulado real

**Função modificada**:
- `calculateReturns()`: Agora aceita parâmetro `period` e calcula diferente para anual vs mensal

### 2. `src/lib/services/ranking-service.ts`

**Método `calculateRanking()`**:
- Agora passa o período (`period`) para `calculateReturns()`
- Ranking anual usa retorno acumulado
- Ranking mensal usa retorno anualizado

**Método `calculateUserPortfolio()`**:
- Continua usando período 'mensal' (retorno anualizado)
- Mantém compatibilidade com código existente

## Benefícios

1. **Justiça no Ranking**: Ranking anual compara retornos reais, não projeções
2. **Transparência**: Usuários veem retornos que realmente obtiveram
3. **Precisão**: Não há distorções de investimentos recentes
4. **Clareza**: Fica claro que ranking anual é sobre performance acumulada

## Observações Importantes

- **Ranking Anual**: Usa retorno **acumulado real** desde o início do ano
- **Ranking Mensal**: Continua usando retorno **anualizado/projetado**
- **calculateUserPortfolio()**: Continua retornando retorno anualizado (para compatibilidade)
- O retorno acumulado é calculado sobre **todas as transações** do usuário (não filtra por data ainda)

## Próximos Passos Sugeridos

1. **Filtrar transações por data**: Para ranking anual, considerar apenas transações desde o início do ano
2. **Calcular valor investido desde início do ano**: Separar investimentos do ano atual dos anteriores
3. **Adicionar tooltip na UI**: Explicar que ranking anual mostra retorno acumulado real
4. **Considerar reset anual**: Se houver reset de ranking no início do ano, garantir que transações antigas não sejam consideradas

## Conclusão

O ranking anual agora usa **retorno acumulado real** ao invés de **retorno anualizado projetado**, garantindo que o ranking seja justo e reflita a performance real dos investidores desde o início do ano.

