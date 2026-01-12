# Filtro de Ano Atual no Cálculo do Ranking

## Resumo

Foi implementado um filtro para garantir que o cálculo do ranking considere apenas transações do ano atual. Este filtro foi aplicado em todos os métodos de cálculo do ranking, incluindo o CRON e os endpoints de API.

## Implementação

### Métodos Modificados

#### 1. `calculateBothRankings()`

**Arquivo:** `src/lib/services/ranking-service.ts`

Este método calcula ambos os rankings (mensal e anual) simultaneamente. Foi adicionado filtro para buscar apenas transações do ano atual:

```typescript
const now = new Date();
const yearStart = startOfYear(now);
const yearEnd = endOfYear(now);

const transactions = await prisma.transaction.findMany({
  where: {
    date: {
      gte: yearStart,
      lte: yearEnd,
    },
  },
  include: {
    user: true,
  },
});
```

**Uso:**
- Chamado pelo CRON em `/api/prices/update`
- Garante que rankings mensal e anual usem apenas transações do ano corrente

#### 2. `calculateRanking()`

**Arquivo:** `src/lib/services/ranking-service.ts`

Este método calcula o ranking para um período específico (mensal ou anual). Também foi adicionado o mesmo filtro:

```typescript
const now = new Date();
const yearStart = startOfYear(now);
const yearEnd = endOfYear(now);

const transactions = await prisma.transaction.findMany({
  where: {
    date: {
      gte: yearStart,
      lte: yearEnd,
    },
  },
  include: {
    user: true,
  },
});
```

**Uso:**
- Chamado pelo endpoint `/api/ranking/calculate`
- Usado para cálculos manuais ou de teste

#### 3. `calculateUserPortfolio()`

**Arquivo:** `src/lib/services/ranking-service.ts`

Este método calcula o portfolio de um usuário específico. Também foi adicionado o filtro de ano atual:

```typescript
const now = new Date();
const yearStart = startOfYear(now);
const yearEnd = endOfYear(now);

const transactions = await prisma.transaction.findMany({
  where: {
    userId,
    date: {
      gte: yearStart,
      lte: yearEnd,
    },
  },
});
```

**Uso:**
- Usado para calcular portfolio individual de usuários
- Garante consistência com o cálculo geral do ranking

## Benefícios

1. **Consistência**: Todos os cálculos de ranking agora usam o mesmo critério (ano atual)
2. **Performance**: Reduz a quantidade de transações processadas, melhorando performance
3. **Precisão**: Rankings refletem apenas a atividade do ano corrente
4. **Manutenibilidade**: Filtro aplicado diretamente na query do banco, mais eficiente

## Considerações Técnicas

### Uso de `date-fns`

O filtro utiliza as funções `startOfYear` e `endOfYear` do `date-fns` para calcular corretamente o início e fim do ano atual, considerando timezone local.

### Filtro no Banco de Dados

O filtro é aplicado diretamente na query do Prisma usando `gte` (greater than or equal) e `lte` (less than or equal), garantindo que apenas transações dentro do intervalo sejam retornadas. Isso é mais eficiente do que filtrar após buscar todas as transações.

### Campos Utilizados

O filtro usa o campo `date` da transação, que representa a data em que a transação foi executada (não `createdAt`, que é quando foi registrada no sistema).

## Impacto

### CRON

O CRON que executa em `/api/prices/update` agora calcula rankings apenas com transações do ano atual, garantindo que:
- Rankings sejam resetados anualmente
- Performance seja mantida mesmo com muitos anos de histórico
- Dados sejam consistentes entre execuções

### Endpoints

Os endpoints de cálculo de ranking agora retornam resultados baseados apenas no ano atual:
- `/api/ranking/calculate` - Cálculo manual
- Rankings retornados por `/api/ranking` - Baseados em cálculos do ano atual

### Frontend

O frontend já estava preparado para mostrar apenas transações do ano atual (implementado anteriormente), então agora há consistência total entre:
- Exibição de transações na carteira
- Cálculo do ranking
- Dados mostrados ao usuário

## Testes Recomendados

Você deve testar:
1. Verificar que rankings calculados incluem apenas transações do ano atual
2. Verificar que transações de anos anteriores não aparecem nos rankings
3. Verificar que o CRON calcula corretamente com o filtro aplicado
4. Verificar que o endpoint `/api/ranking/calculate` funciona com o filtro
5. Verificar que `calculateUserPortfolio` retorna dados apenas do ano atual
6. Testar em diferentes momentos do ano para garantir que o filtro funciona corretamente

Você NÃO deve:
1. Remover o filtro sem considerar o impacto em performance
2. Usar filtros diferentes em diferentes métodos (deve ser consistente)
3. Filtrar após buscar todas as transações (deve ser na query)

## Arquivos Modificados

- `src/lib/services/ranking-service.ts` - Adicionado filtro de ano atual em 3 métodos:
  - `calculateBothRankings()`
  - `calculateRanking()`
  - `calculateUserPortfolio()`

## Dependências

- `date-fns` - Para funções `startOfYear` e `endOfYear`
- `@prisma/client` - Para queries com filtros de data






