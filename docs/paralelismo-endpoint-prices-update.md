# Otimização de Paralelismo no Endpoint `/api/prices/update`

## Objetivo

Otimizar o endpoint `/api/prices/update` para executar com paralelismo controlado, aumentando a velocidade de processamento sem sobrecarregar o banco de dados, especialmente em relação às conexões.

## Problema Identificado

O endpoint executava operações de forma sequencial:
1. Atualização de preços de tickers (sequencial com delays progressivos)
2. Cálculo de rankings (processamento sequencial de usuários)

Isso resultava em tempos de execução longos, especialmente com muitos tickers e usuários.

## Solução Implementada

### 1. Utilitário de Paralelismo Controlado

Foi criado o utilitário `parallel-executor.ts` que oferece:

- **Controle de concorrência**: Limita o número de tarefas executadas simultaneamente
- **Delays configuráveis**: Permite adicionar delays entre execuções para evitar rate limiting
- **Jitter aleatório**: Adiciona variação aleatória para evitar sincronização de requisições
- **Tratamento de erros**: Cada tarefa pode falhar independentemente sem afetar as outras

**Funções principais:**
- `executeInParallel`: Executa tarefas em paralelo com controle de concorrência
- `executeInParallelSuccessOnly`: Retorna apenas resultados bem-sucedidos
- `executeInParallelWithErrors`: Separa resultados bem-sucedidos e erros
- `processInBatches`: Processa itens em lotes com paralelismo controlado

### 2. Otimização do `getBatchPrices` (Yahoo Finance Service)

**Antes:**
- Usava `Promise.allSettled` com delays progressivos (100ms * índice)
- Todas as requisições eram iniciadas simultaneamente, causando possível rate limiting

**Depois:**
- Usa paralelismo controlado com:
  - **Concorrência**: 15 requisições simultâneas
  - **Delay mínimo**: 50ms entre requisições
  - **Jitter**: Até 50ms aleatório para evitar sincronização
- Mantém retry logic com backoff exponencial para cada ticker individualmente

**Benefícios:**
- Reduz tempo total de execução
- Evita rate limiting do Yahoo Finance
- Melhor uso de recursos de rede

### 3. Paralelização do Processamento de Usuários

**Antes:**
- Loop sequencial `for (const user of users)`
- Cada usuário era processado completamente antes do próximo

**Depois:**
- Processamento paralelo com:
  - **Concorrência**: 7 usuários simultâneos
  - Sem delays (já controlado pela concorrência)
- Cada usuário é processado independentemente
- Sistema de checkpoint para continuar execuções interrompidas

**Benefícios:**
- Reduz significativamente o tempo de cálculo de rankings
- Não sobrecarrega o banco de dados (limite de 7 conexões simultâneas, seguro para Supabase)
- Mantém consistência dos dados (usa os mesmos preços para todos)
- Suporta continuação de execuções que não completam em 60s

## Configurações de Paralelismo

### Para APIs Externas (Yahoo Finance)
```typescript
{
  concurrency: 15,  // Até 15 requisições simultâneas
  minDelay: 50,     // 50ms entre requisições
  maxJitter: 50     // Até 50ms de jitter aleatório
}
```

**Justificativa:**
- APIs externas podem ter rate limiting
- 15 requisições simultâneas é um bom equilíbrio entre velocidade e respeito aos limites
- Delays e jitter ajudam a evitar bloqueios

### Para Processamento de Usuários (Banco de Dados)
```typescript
{
  concurrency: 7,   // Até 7 usuários simultâneos
  minDelay: 0,      // Sem delay
  maxJitter: 0      // Sem jitter
}
```

**Justificativa:**
- Limita conexões simultâneas ao banco de dados
- 7 é um número seguro para Supabase com pgbouncer (pooler permite até 400 conexões)
- Cada processamento de usuário já envolve múltiplas queries (transações, assets, etc.)
- Não precisa de delays pois a concorrência já controla a carga
- Supabase usa Supavisor (substituiu PgBouncer) que gerencia eficientemente o pool de conexões

## Impacto Esperado

### Tempo de Execução

**Antes:**
- 100 tickers: ~10 segundos (100ms * 100)
- 50 usuários: ~50-100 segundos (sequencial)

**Depois:**
- 100 tickers: ~1-2 segundos (15 simultâneos, ~7 batches)
- 50 usuários: ~7-14 segundos (7 simultâneos, ~7 batches)

### Uso de Recursos

- **Conexões de banco**: Máximo de 7 simultâneas (controlado, seguro para Supabase)
- **Requisições HTTP**: Máximo de 15 simultâneas (controlado)
- **Memória**: Aumento moderado (mantém resultados em memória durante processamento)
- **Timeout**: 60 segundos por execução (com checkpoint para continuar)

### Sistema de Checkpoint

O endpoint agora suporta execuções parciais:
- **Timeout de 60s**: Se a execução não completar em 60 segundos, salva o progresso
- **Continuação automática**: Próxima execução continua de onde parou
- **Estado persistente**: Progresso salvo na tabela `PriceUpdateCheckpoint`
- **Atualização periódica**: Checkpoint atualizado a cada 5 segundos durante processamento

## Considerações de Segurança

1. **Rate Limiting**: Mantido no endpoint (1 requisição por minuto)
2. **Validação de Token**: Mantida para autenticação do cron
3. **Tratamento de Erros**: Cada tarefa falha independentemente, não afeta o resto

## Monitoramento Recomendado

1. **Tempo de execução**: Monitorar `durationMs` na resposta do endpoint
2. **Taxa de erros**: Verificar `errors` no retorno
3. **Conexões de banco**: Monitorar pool de conexões do Prisma
4. **Rate limiting**: Verificar logs de erros do Yahoo Finance

## Arquivos Modificados

1. `src/lib/utils/parallel-executor.ts` - Novo utilitário
2. `src/lib/services/yahoo-finance-service.ts` - Otimizado `getBatchPrices`
3. `src/lib/services/ranking-service.ts` - Paralelizado `calculateBothRankings` + novo método `calculateBothRankingsWithCheckpoint`
4. `src/lib/services/checkpoint-service.ts` - Novo serviço para gerenciar checkpoints
5. `src/app/api/prices/update/route.ts` - Endpoint modificado para usar checkpoint e timeout
6. `prisma/schema.prisma` - Adicionado model `PriceUpdateCheckpoint`
7. `prisma/migrations/20260108224121_add_price_update_checkpoint/` - Migration para tabela de checkpoint

## Como Usar o Utilitário de Paralelismo

### Exemplo Básico

```typescript
import { executeInParallel } from '@/lib/utils/parallel-executor';

const tasks = items.map(item => async () => {
  return await processItem(item);
});

const results = await executeInParallel(tasks, {
  concurrency: 10,
  minDelay: 100,
  maxJitter: 50,
});

for (const result of results) {
  if (result.success) {
    console.log('Sucesso:', result.result);
  } else {
    console.error('Erro:', result.error);
  }
}
```

### Exemplo com Apenas Sucessos

```typescript
import { executeInParallelSuccessOnly } from '@/lib/utils/parallel-executor';

const tasks = items.map(item => async () => {
  return await processItem(item);
});

const successes = await executeInParallelSuccessOnly(tasks, {
  concurrency: 10,
});
```

### Exemplo com Separação de Erros

```typescript
import { executeInParallelWithErrors } from '@/lib/utils/parallel-executor';

const tasks = items.map(item => async () => {
  return await processItem(item);
});

const { successes, errors } = await executeInParallelWithErrors(tasks, {
  concurrency: 10,
});

console.log(`${successes.length} sucessos, ${errors.length} erros`);
```

## Sistema de Checkpoint

### Como Funciona

1. **Primeira Execução**:
   - Cria checkpoint com status `in_progress` e fase `prices`
   - Atualiza preços de todos os tickers
   - Atualiza checkpoint para fase `ranking`
   - Processa usuários em paralelo (até 7 simultâneos)
   - Atualiza checkpoint a cada 5 segundos com progresso

2. **Timeout (60s)**:
   - Se não completar em 60s, salva estado parcial no checkpoint
   - Retorna resposta com `partial: true` e informações de progresso
   - Próxima execução detecta checkpoint em progresso e continua

3. **Continuação**:
   - Detecta checkpoint existente com status `in_progress`
   - Carrega usuários já processados do checkpoint
   - Processa apenas usuários restantes
   - Se completar, marca checkpoint como `completed`

### Estrutura do Checkpoint

```typescript
{
  id: string;
  status: 'in_progress' | 'completed' | 'failed';
  phase: 'prices' | 'ranking';
  processedUserIds: string[];  // IDs dos usuários já processados
  monthlyRankings?: RankingEntryForStorage[];  // Rankings parciais
  annualRankings?: RankingEntryForStorage[];    // Rankings parciais
  pricesLastUpdate?: Date;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### Resposta do Endpoint

**Execução Completa:**
```json
{
  "success": true,
  "tickersUpdated": "atualizado",
  "pricesLastUpdate": "2026-01-08T...",
  "rankingCalculated": true,
  "usersRanked": 50,
  "checkpointUsed": false,
  "durationMs": 45000
}
```

**Execução Parcial (Timeout):**
```json
{
  "success": true,
  "partial": true,
  "rankingCalculated": false,
  "message": "Processamento parcial. Próxima execução continuará de onde parou.",
  "checkpointId": "uuid-do-checkpoint",
  "processedUsers": 35,
  "totalUsers": 50,
  "progress": 70,
  "durationMs": 60000
}
```

## Ajustes Futuros

Se necessário ajustar o paralelismo:

1. **Aumentar concorrência de APIs**: Se o rate limiting permitir, pode aumentar de 15 para 20-25
2. **Aumentar concorrência de usuários**: Com Supabase, pode aumentar de 7 para 10-15 se necessário (pooler suporta até 400 conexões)
3. **Ajustar delays**: Se houver muitos erros de rate limiting, aumentar `minDelay` e `maxJitter`
4. **Ajustar timeout**: Se necessário mais tempo, aumentar `MAX_EXECUTION_TIME_MS` no endpoint
5. **Ajustar intervalo de checkpoint**: Modificar `CHECKPOINT_UPDATE_INTERVAL` no ranking service (atualmente 5s)

## Notas Técnicas

- O paralelismo é controlado por Promise.race para garantir que sempre há espaço para novas tarefas
- Os resultados são mantidos na ordem original usando índices
- Erros são capturados individualmente e não interrompem o processamento
- O utilitário é genérico e pode ser usado em outros contextos do projeto
- Checkpoints são limpos automaticamente (mantém apenas os últimos 10)
- O sistema garante que preços são atualizados apenas uma vez por execução (mesmo com checkpoint)
- Rankings parciais são salvos no checkpoint e mesclados na continuação

## Limites do Supabase

Baseado na pesquisa realizada:
- **Supabase usa Supavisor** (substituiu PgBouncer) como pooler de conexões
- **Tamanho "Small"**: 90 conexões diretas + 400 conexões via pooler
- **Recomendação**: Usar até 80% das conexões disponíveis para o pool
- **Nossa configuração**: 7 conexões simultâneas é muito seguro (menos de 2% do pool)
- **Margem de segurança**: Podemos aumentar para 10-15 se necessário sem problemas

