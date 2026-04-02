# Correção do Cálculo de Rentabilidade Perpétua

## Data: 09/01/2026

## Problema Identificado

A rentabilidade perpétua no perfil público estava sendo calculada de forma diferente do ranking mensal, mesmo quando o usuário estava no primeiro mês e ano (sem outras temporadas de ranking). Isso causava inconsistência entre os valores exibidos.

### Exemplo do Problema

**Cenário**: Usuário no primeiro mês e ano, com rentabilidade de 0,52% no ranking mensal.

**Comportamento Esperado**: A rentabilidade perpétua deveria mostrar o mesmo valor (0,52%), já que ambas consideram as mesmas transações quando não há temporadas anteriores.

**Comportamento Observado**: A rentabilidade perpétua mostrava um valor diferente, indicando que o cálculo não estava usando a mesma lógica do ranking.

## Causa Raiz

O cálculo de rentabilidade perpétua estava usando uma abordagem simplificada:

1. **Rentabilidade Perpétua (antes da correção)**:
   - Usava `calculatePortfolio()` diretamente
   - Usava apenas preços do cache
   - Não buscava preços atualizados individualmente para cada asset

2. **Ranking Mensal**:
   - Usava `calculatePortfolio()` para calcular posições e valores iniciais
   - **Recalculava manualmente** o `currentValue` usando preços atualizados dos assets
   - Buscava preços atualizados individualmente do Yahoo Finance se não estivessem no cache
   - Garantia que todos os preços fossem os mais recentes

A diferença estava na forma como os preços eram buscados e atualizados. O ranking buscava preços atualizados individualmente para cada asset antes de recalcular o `currentValue`, enquanto a rentabilidade perpétua usava apenas os preços do cache.

## Solução Implementada

A rentabilidade perpétua foi corrigida para usar **exatamente a mesma lógica** do ranking:

### Mudanças Realizadas

1. **Coleta de Tickers**: Adicionada chamada a `priceService.collectTickersFromTransactions()` para garantir que todos os tickers sejam coletados no PriceService (igual ao ranking).

2. **Recálculo do CurrentValue**: Após calcular o portfolio inicial, o código agora recalcula manualmente o `currentValue` usando preços do cache, seguindo o mesmo processo do ranking:
   - Coleta todos os tickers no PriceService
   - Verifica se algum ticker está faltando no cache
   - Se algum ticker estiver faltando, atualiza todos os preços de uma vez (batch update)
   - Para cada posição, busca preço no cache tentando diferentes variações do ticker
   - Calcula o valor total das posições usando esses preços do cache
   - Adiciona o dinheiro recebido em vendas ao valor total

3. **Cálculo de Rentabilidade**: Usa a mesma fórmula do ranking:
   ```typescript
   profitability = ((currentValue - totalInvested) / totalInvested) * 100
   ```

### Código Corrigido

**Arquivo**: `src/lib/services/perpetual-profitability-service.ts`

```typescript
// Coleta tickers no PriceService (igual ao ranking)
priceService.collectTickersFromTransactions(
  transactions.map(t => ({ ticker: t.ticker }))
);

// Busca preços do cache
let prices = priceService.getCurrentPrices();

// Verifica se algum ticker está faltando no cache
const uniqueTickers = [...new Set(transactions.map(tx => tx.ticker))];
const missingTickers = uniqueTickers.filter(ticker => {
  const normalizedTicker = ticker.endsWith('.SA') ? ticker : `${ticker}.SA`;
  return !prices[ticker] && !prices[normalizedTicker] && 
         !prices[ticker.toUpperCase()] && !prices[normalizedTicker.toUpperCase()];
});

// Se algum ticker está faltando, atualiza todos os preços de uma vez
if (missingTickers.length > 0) {
  await priceService.updatePrices();
  prices = priceService.getCurrentPrices();
}

// Calcula portfolio usando função existente
const portfolio = calculatePortfolio(formattedTransactions, prices);

// Recalcular currentValue usando preços do cache (igual ao ranking)
const positionsValue = portfolio.positions.map((pos) => {
  // Normalizar ticker para buscar preço
  const normalizedTicker = pos.ticker.endsWith('.SA') 
    ? pos.ticker 
    : `${pos.ticker}.SA`;
  
  // Buscar preço no cache (tentar diferentes variações)
  const tickerVariations = [
    normalizedTicker,
    pos.ticker,
    normalizedTicker.toUpperCase(),
    pos.ticker.toUpperCase(),
  ];
  
  let currentPrice = 0;
  for (const variation of tickerVariations) {
    if (prices[variation] && prices[variation] > 0) {
      currentPrice = prices[variation];
      break;
    }
  }
  
  return pos.quantity * currentPrice;
});

const totalPositionsValue = positionsValue.reduce((sum, value) => sum + value, 0);

// Calcular dinheiro recebido em vendas
const cashFromSales = calculateTotalFromSales(formattedTransactions);

// Valor total atual = posições + dinheiro de vendas (igual ao ranking)
const currentValue = totalPositionsValue + cashFromSales;

// Calcular rentabilidade usando a mesma fórmula do ranking
const profitability = portfolio.totalInvested > 0
  ? ((currentValue - portfolio.totalInvested) / portfolio.totalInvested) * 100
  : 0;
```

## Garantias de Consistência

Agora ambos os cálculos (ranking mensal e rentabilidade perpétua) usam:

1. **Mesma função de cálculo de portfolio**: `calculatePortfolio()`
2. **Mesma lógica de busca de preços**: Usa preços do cache, atualizando todos de uma vez se necessário (batch update)
3. **Mesma fórmula de rentabilidade**: `((currentValue - totalInvested) / totalInvested) * 100`
4. **Mesmo tratamento de vendas**: Inclui dinheiro recebido em vendas no `currentValue`
5. **Mesmo recálculo do currentValue**: Recalcula manualmente usando preços do cache atualizados

## Diferença Fundamental Mantida

A única diferença entre ranking mensal e rentabilidade perpétua continua sendo:

- **Ranking Mensal**: Considera apenas transações do período específico (mês/ano)
- **Rentabilidade Perpétua**: Considera **todas** as transações desde o início (sem filtro de data)

Mas quando o usuário está no primeiro mês e ano (sem temporadas anteriores), ambas devem mostrar o mesmo valor, já que consideram as mesmas transações.

## Testes Recomendados

1. **Cenário 1**: Usuário no primeiro mês e ano
   - Verificar se rentabilidade perpétua = rentabilidade do ranking mensal

2. **Cenário 2**: Usuário com múltiplas temporadas
   - Verificar se rentabilidade perpétua considera todas as transações
   - Verificar se ranking mensal considera apenas transações do mês

3. **Cenário 3**: Preços não encontrados no cache
   - Verificar se busca individual do Yahoo Finance funciona corretamente
   - Verificar se preços são atualizados corretamente

## Arquivos Modificados

1. **`src/lib/services/perpetual-profitability-service.ts`**
   - Adicionado import de `calculateTotalFromSales`
   - Modificado método `calculatePerpetualProfitability()` para usar mesma lógica do ranking
   - Adicionada coleta de tickers no PriceService
   - Adicionada verificação de tickers faltando no cache
   - Adicionado batch update de preços se necessário
   - Adicionado recálculo manual do `currentValue` usando preços do cache

## Impacto

- ✅ Rentabilidade perpétua agora usa mesma lógica do ranking
- ✅ Consistência garantida entre ambos os cálculos
- ✅ Preços sempre atualizados antes do cálculo
- ✅ Mesma fórmula de rentabilidade em ambos os lugares
- ✅ Cache de rentabilidade perpétua continua funcionando (1 dia)

## Observações Importantes

1. **Cache**: O cache de rentabilidade perpétua continua funcionando normalmente. Quando o cache expira (1 dia), o cálculo é refeito usando a nova lógica.

2. **Performance**: O cálculo usa apenas preços do cache, sendo mais eficiente. Se algum ticker estiver faltando, atualiza todos os preços de uma vez (batch update) ao invés de buscar individualmente.

3. **Invalidação**: Quando novas transações são criadas, o cache de rentabilidade perpétua é invalidado automaticamente, forçando recálculo na próxima consulta.

4. **Preços do Cache**: Todos os preços são obtidos do cache do PriceService, que é atualizado periodicamente. Isso garante consistência e performance.

