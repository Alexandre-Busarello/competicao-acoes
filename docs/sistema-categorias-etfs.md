# Sistema de Categorias de ETFs

## Data: 09/01/2026

## Visão Geral

Foi implementado um sistema completo de categorização de ETFs (Exchange Traded Funds), permitindo que ETFs sejam classificados em categorias específicas e exibidos separadamente na alocação de ativos.

## Arquivos Criados/Modificados

### 1. Novo Arquivo: `src/lib/data/etfs.ts`

Arquivo centralizado contendo:
- Lista completa de ETFs brasileiros e internacionais
- Categorias de ETFs
- Funções auxiliares para buscar informações de ETFs

#### Estrutura de Dados:

```typescript
export interface ETFInfo {
  ticker: string;
  name: string;
  category: 'acoes' | 'crypto' | 'commodities' | 'dividendos' | 'internacional' | 'setorial' | 'sustentabilidade' | 'renda-fixa';
  exchange?: 'B3' | 'NYSE' | 'NASDAQ' | 'other';
}
```

#### Categorias de ETFs:

1. **acoes**: ETFs de índices de ações (Ibovespa, S&P 500, Small Caps, etc.)
2. **crypto**: ETFs de criptomoedas
3. **commodities**: ETFs de commodities (ouro, petróleo, etc.)
4. **dividendos**: ETFs focados em dividendos
5. **internacional**: ETFs de índices internacionais
6. **setorial**: ETFs setoriais (tecnologia, energia, etc.)
7. **sustentabilidade**: ETFs ESG e sustentabilidade
8. **renda-fixa**: ETFs de renda fixa

#### Funções Exportadas:

- `getETFInfo(ticker: string)`: Busca informação de um ETF pelo ticker
- `getKnownETFTickers()`: Retorna todos os tickers de ETFs conhecidos
- `getETFsByCategory(category)`: Retorna ETFs por categoria
- `getCategoryDisplayName(category)`: Retorna nome da categoria para exibição

### 2. Modificação: `src/types/index.ts`

Adicionado tipo `ETFCategory` e propriedade `etfCategory` ao `Asset`:

```typescript
export type ETFCategory = 'acoes' | 'crypto' | 'commodities' | 'dividendos' | 'internacional' | 'setorial' | 'sustentabilidade' | 'renda-fixa';

export interface Asset {
  // ... outras propriedades
  etfCategory?: ETFCategory; // Categoria do ETF (apenas quando type === 'etf')
}
```

### 3. Modificação: `src/lib/utils/asset-type.ts`

#### Novas Funções:

- `getETFCategory(ticker: string)`: Retorna a categoria do ETF se o ativo for um ETF conhecido
- `getAssetName()`: Atualizado para usar nomes do arquivo de ETFs quando disponível

#### Mudanças:

- Removida lista hardcoded de ETFs
- Agora usa `getETFInfo()` do arquivo `etfs.ts` para verificar se um ticker é ETF conhecido

### 4. Modificação: `src/lib/services/ranking-service.ts`

Atualizado para incluir `etfCategory` ao criar assets:

```typescript
const assetType = determineAssetType(pos.ticker, quoteData);
const assetName = getAssetName(pos.ticker, quoteData);
const etfCategory = assetType === 'etf' ? getETFCategory(pos.ticker) : undefined;

return {
  // ... outras propriedades
  type: assetType,
  etfCategory,
  // ...
};
```

### 5. Modificação: `src/components/portfolio/AssetAllocationChart.tsx`

Atualizado para agrupar ETFs por categoria na exibição:

#### Mudanças Principais:

1. **Cores por Categoria de ETF**:
```typescript
const COLORS = {
  // ... outras cores
  'etf-acoes': '#06b6d4',
  'etf-crypto': '#f97316',
  'etf-commodities': '#f59e0b',
  'etf-dividendos': '#10b981',
  'etf-internacional': '#3b82f6',
  'etf-setorial': '#8b5cf6',
  'etf-sustentabilidade': '#10b981',
  'etf-renda-fixa': '#f59e0b',
  etf: '#06b6d4', // Fallback para ETFs sem categoria
};
```

2. **Agrupamento por Categoria**:
```typescript
// Para ETFs, usar categoria específica se disponível
let key: string;
if (asset.type === 'etf' && asset.etfCategory) {
  key = `etf-${asset.etfCategory}`;
} else {
  key = asset.type;
}
```

3. **Nomes de Exibição**:
```typescript
if (item.name.startsWith('etf-')) {
  const category = item.name.replace('etf-', '') as ETFCategory;
  displayName = getCategoryDisplayName(category); // Ex: "ETF - Ações", "ETF - Cripto"
}
```

## ETFs Incluídos

### ETFs Brasileiros (B3):

#### ETFs de Ações:
- BOVA11, IVVB11, SMAL11, SPXI11, BOVV11, BOVB11, BOVX11, SMAC11, BRAX11, BOVS11, BOVH11

#### ETFs de Cripto:
- HASH11, CRIP11, BITH11, QBTC11, QETH11, BCHG11, BLCK11, DEFI11

#### ETFs de Commodities:
- GOLD11

#### ETFs de Dividendos:
- DIVO11, FIND11, DVFI11, RDIV11

#### ETFs Internacionais:
- ISUS11

#### ETFs Setoriais:
- WEB311, TECB11

#### ETFs de Sustentabilidade:
- ECOO11, ESG11

#### ETFs de Renda Fixa:
- AGTB11, B5P211, B5MB11

### ETFs Internacionais:

#### ETFs de Ações (NYSE/NASDAQ):
- SPY, QQQ, VTI, VEA, VWO, IEMG, EFA

#### ETFs de Commodities:
- GOLD, GLD, SLV, USO

#### ETFs Setoriais:
- XLK, XLF, XLE, XLV, XLI, XLP, XLY, XLB, XLU, XLRE

#### ETFs de Sustentabilidade:
- ESGU, ESGD, ESGE

## Comportamento

### Classificação de Ativos:

1. **Quando há quoteData do Yahoo Finance**:
   - Verifica `quoteType` e `longName` para identificar ETFs
   - Se identificado como ETF, busca categoria no arquivo `etfs.ts`

2. **Quando não há quoteData**:
   - Verifica se o ticker está na lista de ETFs conhecidos em `etfs.ts`
   - Se estiver, retorna tipo 'etf' e busca categoria

### Exibição na Alocação:

- **ETFs com categoria**: Agrupados por categoria (ex: "ETF - Ações", "ETF - Cripto")
- **ETFs sem categoria**: Agrupados como "ETFs" genérico
- **Outros ativos**: Mantêm exibição original (Ações, FIIs, etc.)

## Benefícios

1. **Organização**: ETFs são categorizados e exibidos de forma mais clara
2. **Escalabilidade**: Fácil adicionar novos ETFs ao arquivo `etfs.ts`
3. **Manutenibilidade**: Lista centralizada de ETFs facilita atualizações
4. **Precisão**: Nomes corretos dos ETFs são exibidos quando disponíveis
5. **Flexibilidade**: Sistema suporta ETFs brasileiros e internacionais

## Como Adicionar Novos ETFs

1. Abrir `src/lib/data/etfs.ts`
2. Adicionar entrada no array `ETFS`:
```typescript
{ ticker: 'NOVO11', name: 'Nome do ETF', category: 'acoes', exchange: 'B3' },
```
3. O sistema automaticamente reconhecerá o novo ETF

## Observações

- A categoria é opcional (`etfCategory?`) - ETFs sem categoria aparecem como "ETFs" genérico
- O sistema funciona tanto para ETFs brasileiros (.SA) quanto internacionais
- Nomes dos ETFs são buscados primeiro do arquivo `etfs.ts`, depois do Yahoo Finance
- Cores diferentes são usadas para cada categoria de ETF no gráfico

## Testes Recomendados

1. ✅ Verificar que ETFs conhecidos são classificados corretamente
2. ✅ Verificar que categorias são atribuídas corretamente
3. ✅ Verificar que ETFs aparecem agrupados por categoria na alocação
4. ✅ Verificar que nomes corretos são exibidos
5. ✅ Verificar que cores diferentes são usadas para cada categoria






