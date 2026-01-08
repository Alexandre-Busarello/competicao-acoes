# Correção do Cálculo de Rentabilidade com Vendas

## Data: 08/01/2026

## Problema Identificado

O cálculo de rentabilidade estava incorreto quando havia transações de venda. O sistema estava calculando apenas o valor investido em compras, sem considerar o dinheiro recebido nas vendas no valor atual da carteira.

### Exemplo do Problema

**Transações:**
- Compra: 100 PETR4.SA a R$ 29.83 = R$ 2.983,00 investido
- Venda: 50 PETR4.SA a R$ 29.97 = R$ 1.498,50 recebido (lucro de R$ 7,00)
- Posição atual: 50 ações

**Cálculo Incorreto (antes da correção):**
- Investimento total: R$ 2.983,00 (apenas compras)
- Valor atual: 50 ações * preço atual (ex: R$ 29.83) = R$ 1.491,50
- Rentabilidade: (R$ 1.491,50 - R$ 2.983,00) / R$ 2.983,00 = **-49,97%** ❌

**Cálculo Correto (após a correção):**
- Investimento total: R$ 2.983,00 (compras)
- Valor atual: (50 ações * preço atual) + R$ 1.498,50 (dinheiro recebido) = R$ 2.990,00
- Rentabilidade: (R$ 2.990,00 - R$ 2.983,00) / R$ 2.983,00 = **+0,23%** ✅

## Problemas Adicionais Identificados

### Problema 2: Preço Médio Incorreto Após Vendas

Quando havia vendas, o preço médio estava sendo calculado incorretamente. O sistema não estava reduzindo o `totalValue` proporcionalmente quando ações eram vendidas.

**Exemplo:**
- Compra 100 ações a R$ 29.83: totalValue = 2983, avgPrice = 29.83 ✅
- Venda 50 ações: quantity = 50, mas totalValue ainda era 2983 ❌
- Preço médio calculado: 2983 / 50 = **59.66** ❌ (deveria ser 29.83)

### Problema 3: Normalização de Tickers

Variações de ticker como "PETR4" e "PETR4.SA" não estavam sendo agrupadas corretamente, causando cálculos duplicados ou incorretos.

## Solução Implementada

### 1. Função de Normalização de Tickers

Criada função `normalizeTickerForGrouping()` para garantir que variações de ticker sejam tratadas como o mesmo ativo:

```typescript
function normalizeTickerForGrouping(ticker: string): string {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Se já tem .SA, retorna como está
  if (upperTicker.endsWith('.SA')) {
    return upperTicker;
  }
  
  // Se parece ser ticker brasileiro, adiciona .SA
  if (/^[A-Z]{4,5}\d{1,2}$/.test(upperTicker)) {
    return `${upperTicker}.SA`;
  }
  
  return upperTicker;
}
```

### 2. Correção do Cálculo de Posições

A função `calculatePositions()` agora reduz o `totalValue` proporcionalmente quando há vendas:

```typescript
if (tx.type === 'venda') {
  // Calcula o preço médio atual antes da venda
  const currentAveragePrice = current.quantity > 0 
    ? current.totalValue / current.quantity 
    : 0;
  
  // Reduz quantidade e totalValue proporcionalmente
  current.quantity -= tx.quantity;
  
  if (currentAveragePrice > 0) {
    // Reduz o totalValue usando o preço médio de compra
    current.totalValue = current.quantity * currentAveragePrice;
  }
}
```

### 3. Função `calculateTotalFromSales()` Melhorada

A função agora agrupa vendas por ticker normalizado para evitar duplicação:

```typescript
export function calculateTotalFromSales(
  transactions: Transaction[]
): number {
  // Agrupa vendas por ticker normalizado
  const salesByTicker = new Map<string, number>();
  
  for (const tx of transactions) {
    if (tx.type === 'venda') {
      const normalizedTicker = normalizeTickerForGrouping(tx.ticker);
      const currentTotal = salesByTicker.get(normalizedTicker) || 0;
      salesByTicker.set(normalizedTicker, currentTotal + tx.quantity * tx.price);
    }
  }
  
  // Soma todos os valores de vendas
  let total = 0;
  for (const value of salesByTicker.values()) {
    total += value;
  }
  
  return total;
}
```

### 4. Atualização da Função `calculateCurrentValue()`

A função agora aceita um parâmetro opcional `cashFromSales` para incluir o dinheiro recebido em vendas:

```typescript
export function calculateCurrentValue(
  positions: Position[],
  prices: PriceMap,
  cashFromSales: number = 0
): number {
  // ... cálculo do valor das posições ...
  
  // Adiciona o dinheiro recebido em vendas ao valor atual
  return totalValue + cashFromSales;
}
```

### 5. Atualização da Função `calculatePortfolio()`

A função agora calcula corretamente o valor atual incluindo dinheiro de vendas:

```typescript
export function calculatePortfolio(
  transactions: Transaction[],
  prices: PriceMap
): PortfolioCalculation {
  const positions = calculatePositions(transactions);
  const totalInvested = calculateTotalInvested(transactions);
  const cashFromSales = calculateTotalFromSales(transactions);
  const currentValue = calculateCurrentValue(positions, prices, cashFromSales);
  // ...
}
```

### 6. Correção no Ranking Service

O `ranking-service.ts` foi atualizado para usar o `currentValue` do portfolio calculado, que já inclui o dinheiro de vendas, em vez de recalcular manualmente apenas o valor das posições.

**Antes:**
```typescript
const currentValue = assets.reduce((sum, asset) => {
  return sum + (asset.quantity * asset.currentPrice);
}, 0);
```

**Depois:**
```typescript
const currentValue = portfolio.currentValue; // Já inclui dinheiro recebido em vendas
```

## Conceito de Rentabilidade Corrigido

### Investimento Inicial
- **Total investido**: Soma de todas as compras realizadas
- Não subtrai vendas, pois representa o capital inicial investido

### Valor Atual da Carteira
- **Valor atual**: Valor das posições atuais + Dinheiro recebido em vendas
- Inclui tanto o valor das ações ainda mantidas quanto o dinheiro já recebido

### Rentabilidade
- **Fórmula**: `(Valor Atual - Investimento Inicial) / Investimento Inicial * 100`
- Agora reflete corretamente o desempenho total, incluindo lucros realizados em vendas

## Arquivos Modificados

1. **`src/lib/utils/portfolio-calculator.ts`**
   - Adicionada função `normalizeTickerForGrouping()` para normalizar tickers
   - Corrigida função `calculatePositions()` para reduzir `totalValue` proporcionalmente em vendas
   - Adicionada função `calculateTotalFromSales()` com agrupamento por ticker normalizado
   - Atualizada função `calculateCurrentValue()` para aceitar `cashFromSales`
   - Atualizada função `calculatePortfolio()` para incluir dinheiro de vendas

2. **`src/lib/services/ranking-service.ts`**
   - Método `calculateBothRankings()`: Usa `portfolio.currentValue` em vez de recalcular
   - Método `calculateUserPortfolio()`: Usa `portfolio.currentValue` em vez de recalcular

## Impacto

- ✅ Preço médio agora calculado corretamente após vendas
- ✅ Tickers normalizados corretamente (PETR4 = PETR4.SA)
- ✅ Rentabilidade agora reflete corretamente lucros realizados em vendas
- ✅ Ranking mensal e anual calculados corretamente com vendas
- ✅ Portfolio individual calculado corretamente
- ✅ Compatibilidade mantida com código existente (parâmetro opcional)

## Testes Recomendados

1. **Cenário 1: Venda com Lucro**
   - Compra 100 ações a R$ 10
   - Vende 50 ações a R$ 12
   - Deve mostrar rentabilidade positiva

2. **Cenário 2: Venda com Prejuízo**
   - Compra 100 ações a R$ 10
   - Vende 50 ações a R$ 8
   - Deve mostrar rentabilidade negativa (correta)

3. **Cenário 3: Múltiplas Vendas**
   - Compra 100 ações a R$ 10
   - Vende 30 ações a R$ 12
   - Vende 20 ações a R$ 11
   - Deve somar corretamente o dinheiro recebido

4. **Cenário 4: Venda Total**
   - Compra 100 ações a R$ 10
   - Vende todas as 100 ações a R$ 12
   - Deve mostrar rentabilidade de +20%

## Correções Adicionais

### Correção Crítica: Recalcular `currentValue` Após Buscar Preços

**Problema Identificado:** O `calculatePortfolio` era chamado antes de buscar preços do Yahoo Finance. Se o preço não estivesse no cache, o `currentValue` era calculado apenas com o dinheiro de vendas (sem incluir o valor das posições). Depois, quando os preços eram buscados do Yahoo Finance para criar os assets, o `portfolio.currentValue` já havia sido calculado incorretamente.

**Solução:** Todos os métodos de cálculo de ranking agora recalculam o `currentValue` após buscar os preços atualizados dos assets/posições:

```typescript
// Calcular valor das posições com preços atualizados dos assets
const positionsValue = assets.reduce((sum, asset) => {
  return sum + (asset.quantity * asset.currentPrice);
}, 0);

// Calcular dinheiro recebido em vendas
const cashFromSales = calculateTotalFromSales(userTransactions);

// Valor total atual = posições + dinheiro de vendas
const currentValue = positionsValue + cashFromSales;
```

**Métodos Corrigidos:**
- `calculateBothRankings()` - Recalcula após buscar preços dos assets
- `calculateRanking()` - Recalcula após buscar preços dos assets  
- `calculateUserPortfolio()` - Recalcula após buscar preços das posições

**Antes:**
```typescript
const currentValue = assets.reduce((sum, asset) => {
  return sum + (asset.quantity * asset.currentPrice);
}, 0);
```

**Depois:**
```typescript
const currentValue = portfolio.currentValue; // Já inclui dinheiro recebido em vendas
```

### Melhoria na Busca de Preços

A função `calculateCurrentValue` foi melhorada para normalizar tickers e tentar mais variações na busca de preços, garantindo que encontre o preço mesmo com variações de case ou formato.

## Observações Importantes

- O dinheiro recebido em vendas é considerado como parte do valor atual da carteira
- Isso reflete a realidade: quando você vende ações, você tem dinheiro em caixa
- Para ranking competitivo, isso é correto pois compara o patrimônio total atual vs investimento inicial
- O cálculo não considera reinvestimento automático - apenas soma o dinheiro recebido ao valor atual
- Todos os métodos de cálculo de ranking agora usam `portfolio.currentValue` para garantir consistência

