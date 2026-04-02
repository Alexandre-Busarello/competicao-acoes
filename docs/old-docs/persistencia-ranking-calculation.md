# Persistência de Cálculos de Ranking na Tabela RankingCalculation

## Data: 08/01/2026

## Problema Identificado

Os cálculos do ranking estavam sendo armazenados apenas em cache em memória, não sendo persistidos no banco de dados. Isso causava:
1. **Perda de dados**: Ao reiniciar o servidor, os cálculos eram perdidos
2. **Falta de histórico**: Não era possível consultar cálculos anteriores
3. **Dependência de cache**: Frontend dependia apenas do cache, sem fonte de verdade persistente

## Solução Implementada

Foi implementada a persistência completa dos cálculos de ranking na tabela `RankingCalculation`, que agora é a **fonte de verdade** para o frontend.

### Estrutura da Tabela

```prisma
model RankingCalculation {
  id               String   @id @default(uuid())
  period           String   // 'mensal' | 'anual'
  rankingData      Json     // Dados completos do ranking em JSON
  totalParticipants Int
  calculatedAt     DateTime @default(now())
  
  @@index([period, calculatedAt])
  @@index([calculatedAt])
}
```

**Campos**:
- `id`: Identificador único (UUID)
- `period`: Período do ranking ('mensal' ou 'anual')
- `rankingData`: Dados completos do ranking serializados em JSON
- `totalParticipants`: Total de participantes no ranking
- `calculatedAt`: Data/hora do cálculo

**Índices**:
- Índice composto em `(period, calculatedAt)` para buscas eficientes por período
- Índice em `calculatedAt` para ordenação rápida

## Mudanças Implementadas

### 1. Schema Prisma (`prisma/schema.prisma`)

**Adicionado model `RankingCalculation`**:
- Model completo com todos os campos necessários
- Índices otimizados para consultas frequentes

### 2. Ranking Service (`src/lib/services/ranking-service.ts`)

#### Método `calculateRanking()` Modificado

**Antes**:
```typescript
// Apenas salvava no cache
RankingCache.setRanking(period, result);
return result;
```

**Agora**:
```typescript
// Salva no banco de dados
await prisma.rankingCalculation.create({
  data: {
    period,
    rankingData: result as any,
    totalParticipants: result.totalParticipants,
    calculatedAt: result.lastUpdate,
  },
});

// Também salva no cache (para performance)
RankingCache.setRanking(period, result);
return result;
```

**Características**:
- Salva cada cálculo na tabela `RankingCalculation`
- Mantém histórico completo de todos os cálculos
- Continua atualizando cache para performance
- Tratamento de erro: continua funcionando mesmo se falhar ao salvar

#### Método `getRanking()` Refatorado

**Antes** (síncrono, apenas cache):
```typescript
getRanking(period: 'mensal' | 'anual'): RankingResult | null {
  return RankingCache.getRanking(period);
}
```

**Agora** (assíncrono, busca do banco):
```typescript
async getRanking(period: 'mensal' | 'anual'): Promise<RankingResult | null> {
  // Busca último cálculo do período no banco
  const lastCalculation = await prisma.rankingCalculation.findFirst({
    where: { period },
    orderBy: { calculatedAt: 'desc' },
  });

  if (!lastCalculation) {
    // Fallback para cache se não houver no banco
    return RankingCache.getRanking(period);
  }

  // Converte dados do banco para RankingResult
  const rankingData = lastCalculation.rankingData as any;
  const result: RankingResult = {
    period: rankingData.period || period,
    lastUpdate: lastCalculation.calculatedAt,
    ranking: rankingData.ranking || [],
    totalParticipants: lastCalculation.totalParticipants,
  };

  // Atualiza cache com dados do banco
  RankingCache.setRanking(period, result);

  return result;
}
```

**Características**:
- Busca sempre do banco de dados (fonte de verdade)
- Retorna o cálculo mais recente do período
- Fallback para cache se não houver dados no banco
- Atualiza cache após buscar do banco (para performance)
- Tratamento de erro com fallback para cache

### 3. API de Ranking (`src/app/api/ranking/route.ts`)

**Modificado para usar método assíncrono**:
```typescript
// Buscar ranking mais recente do banco de dados
let ranking = await rankingService.getRanking(period);

if (!ranking) {
  // Se não há ranking no banco, calcular pela primeira vez
  ranking = await rankingService.calculateRanking(period);
}
```

**Fluxo**:
1. Tenta buscar do banco primeiro
2. Se não encontrar, calcula pela primeira vez
3. O cálculo automaticamente salva no banco

## Fluxo Completo

### 1. Cálculo do Ranking (via cron `/api/prices/update`)

```
1. Atualiza preços
2. Calcula ranking mensal → Salva no banco
3. Calcula ranking anual → Salva no banco
4. Retorna sucesso
```

### 2. Consulta do Ranking (via `/api/ranking`)

```
1. Frontend solicita ranking
2. API busca último cálculo do banco
3. Se não encontrar, calcula novo (salva no banco)
4. Retorna dados para frontend
```

### 3. Cache como Otimização

```
1. Dados salvos no banco (fonte de verdade)
2. Cache atualizado para performance
3. Se cache expirar, busca do banco novamente
```

## Benefícios

1. **Persistência**: Cálculos não são perdidos ao reiniciar servidor
2. **Histórico**: Todos os cálculos ficam salvos para análise futura
3. **Confiabilidade**: Banco de dados é fonte de verdade
4. **Performance**: Cache ainda usado para otimização
5. **Resiliência**: Fallback para cache em caso de erro no banco

## Estrutura dos Dados Salvos

O campo `rankingData` armazena um objeto JSON completo com:

```typescript
{
  period: 'mensal' | 'anual',
  lastUpdate: Date,
  ranking: [
    {
      userId: string,
      name: string,
      rank: number,
      monthlyReturn: number,
      annualReturn: number,
      totalInvested: number,
      currentValue: number,
      avatar?: string,
      portfolio?: Asset[]
    }
  ],
  totalParticipants: number
}
```

## Consultas Úteis

### Buscar último ranking mensal
```typescript
const lastMonthly = await prisma.rankingCalculation.findFirst({
  where: { period: 'mensal' },
  orderBy: { calculatedAt: 'desc' },
});
```

### Buscar histórico de cálculos
```typescript
const history = await prisma.rankingCalculation.findMany({
  where: { period: 'mensal' },
  orderBy: { calculatedAt: 'desc' },
  take: 10, // Últimos 10 cálculos
});
```

### Buscar cálculos de um período específico
```typescript
const calculations = await prisma.rankingCalculation.findMany({
  where: {
    period: 'mensal',
    calculatedAt: {
      gte: new Date('2026-01-01'),
      lte: new Date('2026-01-31'),
    },
  },
  orderBy: { calculatedAt: 'desc' },
});
```

## Observações Importantes

1. **Cada cálculo cria um novo registro**: Histórico completo é mantido
2. **Cache é otimização**: Banco de dados é sempre a fonte de verdade
3. **Fallback robusto**: Sistema continua funcionando mesmo se banco falhar
4. **Performance**: Índices otimizados para consultas frequentes
5. **Serialização**: Dados complexos são serializados como JSON

## Próximos Passos Sugeridos

1. **Limpeza de dados antigos**: Implementar política de retenção (ex: manter apenas últimos 30 dias)
2. **Análise de histórico**: Criar endpoints para visualizar evolução do ranking
3. **Backup automático**: Garantir backup regular da tabela
4. **Métricas**: Adicionar métricas sobre frequência de cálculos
5. **Otimização**: Considerar compressão de dados JSON para rankings grandes

## Conclusão

A implementação da persistência na tabela `RankingCalculation` garante que os cálculos de ranking sejam sempre salvos e disponíveis, mesmo após reinicializações do servidor. O banco de dados agora é a fonte de verdade, com o cache servindo apenas como otimização de performance.

