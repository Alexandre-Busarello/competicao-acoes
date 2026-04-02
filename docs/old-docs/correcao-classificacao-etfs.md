# Correção da Classificação de ETFs

## Data: 09/01/2026

## Problema Identificado

A carteira estava mostrando ETFs (Exchange Traded Funds) como "Ações" na composição de alocação de ativos. ETFs brasileiros como IVVB11, BOVA11 e GOLD11 estavam sendo classificados incorretamente como FIIs ou Ações, quando deveriam ter sua própria categoria.

## Causa Raiz

A função `determineAssetType` em `src/lib/utils/asset-type.ts` tinha as seguintes limitações:

1. **Falta do tipo 'etf'**: O tipo `AssetType` não incluía 'etf', apenas 'acao', 'fii', 'renda-fixa', 'cripto' e 'outros'
2. **Lógica incorreta**: Qualquer ticker que terminava com "11" era classificado como FII, mas ETFs brasileiros também terminam com "11"
3. **Verificação de quoteData incorreta**: Quando `quoteType.includes('etf')` era verdadeiro, o código retornava 'fii' ao invés de 'etf'

## Solução Implementada

### 1. Adição do Tipo 'etf'

**Arquivo:** `src/types/index.ts`

```typescript
export type AssetType = 'acao' | 'fii' | 'etf' | 'renda-fixa' | 'cripto' | 'outros';
```

### 2. Correção da Lógica de Classificação

**Arquivo:** `src/lib/utils/asset-type.ts`

#### Mudanças Principais:

1. **Verificação de ETFs no quoteData**:
   - Agora verifica se `quoteType.includes('etf')` e retorna 'etf' (não 'fii')
   - Verifica se não é FII antes de classificar como ETF
   - Verifica termos como "exchange traded fund", "índice", "index fund"

2. **Lista de ETFs Conhecidos**:
   - Criada lista de ETFs brasileiros conhecidos para fallback quando não há quoteData
   - Inclui ETFs de índices (IVVB11, BOVA11, SMAL11, etc.)
   - Inclui ETFs de commodities (GOLD11)
   - Inclui ETFs de dividendos, criptomoedas, tecnologia, etc.

3. **Ordem de Verificação**:
   - ETFs são verificados antes de FIIs
   - Se um ticker termina com "11" e está na lista de ETFs conhecidos, retorna 'etf'
   - Caso contrário, se termina com "11", assume FII

#### Código Relevante:

```typescript
// Verificar se há dados do Yahoo Finance que possam ajudar
if (quoteData) {
  const quoteType = quoteData.quoteType?.toLowerCase() || '';
  const longName = (quoteData.longName || quoteData.shortName || '').toLowerCase();
  
  // Verificar se é ETF (Exchange Traded Fund)
  // IMPORTANTE: Verificar ETF antes de FII
  if (
    quoteType.includes('etf') ||
    longName.includes('exchange traded fund') ||
    longName.includes('índice') ||
    longName.includes('index fund')
  ) {
    // Verificar se não é FII (Fundos Imobiliários)
    if (
      longName.includes('fundo imobiliário') ||
      longName.includes('fii') ||
      longName.includes('real estate')
    ) {
      return 'fii';
    }
    return 'etf';
  }
  // ... resto da lógica
}

// Lista de ETFs brasileiros conhecidos
const knownETFs = [
  // Índices
  'IVVB11', 'BOVA11', 'SMAL11', 'SPXI11', 'BOVV11', 'BOVB11', 'BOVX11',
  // Commodities
  'GOLD11',
  // Dividendos
  'DIVO11', 'FIND11',
  // Internacionais
  'ISUS11',
  // Criptomoedas
  'HASH11', 'CRIP11', 'BITH11', 'QBTC11', 'QETH11', 'BCHG11', 'BLCK11', 'DEFI11',
  // Tecnologia
  'WEB311', 'TECB11',
  // Sustentabilidade
  'ECOO11',
  // Small Caps
  'SMAC11'
];

// Remover sufixo .SA se presente para comparação
const baseTicker = upperTicker.replace('.SA', '');

// Verificar se é ETF conhecido
if (knownETFs.includes(baseTicker)) {
  return 'etf';
}
```

### 3. Atualização do Componente de Alocação

**Arquivo:** `src/components/portfolio/AssetAllocationChart.tsx`

#### Mudanças:

1. **Adição de cor para ETFs**:
```typescript
const COLORS = {
  acao: '#3b82f6',
  fii: '#10b981',
  etf: '#06b6d4',  // Nova cor para ETFs (cyan)
  'renda-fixa': '#f59e0b',
  cripto: '#f97316',
  outros: '#8b5cf6',
};
```

2. **Mapeamento de nome para exibição**:
```typescript
const data = Object.values(allocation).map((item) => ({
  name:
    item.name === 'acao'
      ? 'Ações'
      : item.name === 'fii'
      ? 'FIIs'
      : item.name === 'etf'  // Novo mapeamento
      ? 'ETFs'
      : item.name === 'renda-fixa'
      ? 'Renda Fixa'
      : item.name === 'cripto'
      ? 'Criptomoedas'
      : 'Outros',
  value: Number(item.value.toFixed(2)),
}));
```

## ETFs Suportados

A lista atual de ETFs conhecidos inclui:

### ETFs de Índices:
- **IVVB11**: iShares S&P 500
- **BOVA11**: iShares Ibovespa
- **SMAL11**: iShares Small Cap
- **SPXI11**: iShares S&P 500 (outro)
- **BOVV11**: iShares Valor
- **BOVB11**: iShares Brasil
- **BOVX11**: iShares Brasil (outro)

### ETFs de Commodities:
- **GOLD11**: Ouro

### ETFs de Dividendos:
- **DIVO11**: Dividendos
- **FIND11**: Índice de Dividendos

### ETFs Internacionais:
- **ISUS11**: iShares S&P 500 (USD)

### ETFs de Criptomoedas:
- **HASH11**, **CRIP11**, **BITH11**, **QBTC11**, **QETH11**, **BCHG11**, **BLCK11**, **DEFI11**

### ETFs de Tecnologia:
- **WEB311**, **TECB11**

### ETFs de Sustentabilidade:
- **ECOO11**

### ETFs de Small Caps:
- **SMAC11**

## Comportamento

### Quando há quoteData do Yahoo Finance:
1. Verifica `quoteType` e `longName` para identificar ETFs
2. Se identificado como ETF e não for FII, retorna 'etf'
3. Caso contrário, segue lógica padrão

### Quando não há quoteData:
1. Remove sufixo `.SA` do ticker se presente
2. Verifica se está na lista de ETFs conhecidos
3. Se estiver, retorna 'etf'
4. Se não estiver e terminar com "11", assume FII
5. Caso contrário, segue lógica padrão para ações

## Resultado

Agora os ETFs são:
- ✅ Classificados corretamente como 'etf'
- ✅ Exibidos separadamente na alocação de ativos como "ETFs"
- ✅ Têm cor própria no gráfico (cyan/azul claro)
- ✅ Distinguidos de FIIs e Ações

## Observações

- A lista de ETFs conhecidos pode ser expandida conforme necessário
- Quando novos ETFs são lançados, podem ser adicionados à lista `knownETFs`
- Se o Yahoo Finance fornecer dados corretos (`quoteType` ou `longName`), a classificação será automática mesmo sem estar na lista
- A classificação é feita dinamicamente, então não é necessário atualizar dados existentes no banco

## Testes Recomendados

1. ✅ Verificar que IVVB11, BOVA11, GOLD11 são classificados como 'etf'
2. ✅ Verificar que FIIs conhecidos (HGLG11, XPLG11) continuam sendo 'fii'
3. ✅ Verificar que ações (PETR4, VALE3) continuam sendo 'acao'
4. ✅ Verificar que ETFs aparecem como "ETFs" na alocação de ativos
5. ✅ Verificar que a cor dos ETFs no gráfico está correta (cyan)

