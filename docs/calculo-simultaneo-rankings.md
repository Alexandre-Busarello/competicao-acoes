# Cálculo Simultâneo de Rankings Mensal e Anual

## Data: 08/01/2026

## Problema Identificado

Os rankings mensal e anual estavam sendo calculados separadamente em paralelo, o que poderia causar inconsistências se os preços mudassem entre os cálculos. Além disso, a tela de ranking não aguardava o request concluir antes de exibir "sem dados".

### Problemas

1. **Inconsistência de preços**: Rankings calculados com preços diferentes
2. **Race condition**: Se preços atualizassem entre cálculos, resultados seriam inconsistentes
3. **UX ruim**: Tela mostrava "sem dados" antes do request terminar

## Solução Implementada

### 1. Método `calculateBothRankings()`

Foi criado um novo método que calcula ambos os rankings usando **exatamente os mesmos preços**:

```typescript
async calculateBothRankings(): Promise<{
  monthly: RankingResult;
  annual: RankingResult;
}>
```

**Características**:
- Carrega transações e usuários **uma única vez**
- Obtém preços **uma única vez** (garante consistência)
- Calcula portfolios usando **os mesmos preços**
- Gera rankings mensal e anual com **valores consistentes**
- Salva ambos no banco **simultaneamente**

### 2. Fluxo de Cálculo

```
1. Carregar transações e usuários (uma vez)
2. Obter preços atuais (uma vez)
3. Para cada usuário:
   - Calcular portfolio usando os mesmos preços
   - Calcular retorno mensal (com período 'mensal')
   - Calcular retorno anual (com período 'anual')
4. Ordenar e atribuir ranks
5. Salvar ambos no banco
6. Atualizar cache
```

### 3. Endpoint `/api/prices/update` Atualizado

**Antes**:
```typescript
const [monthlyRanking, annualRanking] = await Promise.all([
  rankingService.calculateRanking('mensal'),
  rankingService.calculateRanking('anual'),
]);
```

**Agora**:
```typescript
const { monthly: monthlyRanking, annual: annualRanking } = 
  await rankingService.calculateBothRankings();
```

### 4. Loading na Página de Ranking

**Antes**: Mostrava "sem dados" imediatamente, mesmo durante o loading

**Agora**: 
- Mostra loading enquanto `isLoading === true`
- Só exibe conteúdo (ou "sem dados") após request concluir
- Usa componente de loading visual durante a espera

## Arquivos Modificados

### 1. `src/lib/services/ranking-service.ts`

**Novo método `calculateBothRankings()`**:
- Calcula ambos rankings com mesmos preços
- Garante consistência total
- Salva ambos no banco simultaneamente

### 2. `src/app/api/prices/update/route.ts`

**Atualizado para usar `calculateBothRankings()`**:
- Substituído `Promise.all` de dois cálculos separados
- Agora usa método único que garante consistência

### 3. `src/app/(main)/ranking/page.tsx`

**Loading corrigido**:
- Remove lógica duplicada de fetch (já feito pelo store)
- Usa `isLoading` do store para controlar exibição
- Mostra loading visual enquanto aguarda request
- Só exibe conteúdo após request concluir

## Benefícios

1. **Consistência**: Rankings sempre calculados com mesmos preços
2. **Precisão**: Elimina race conditions e inconsistências
3. **Performance**: Carrega dados uma vez, calcula ambos
4. **UX melhorada**: Loading adequado, não mostra "sem dados" prematuramente
5. **Manutenibilidade**: Código mais simples e centralizado

## Exemplo de Uso

### Cálculo via Cron

```typescript
// /api/prices/update
const { monthly, annual } = await rankingService.calculateBothRankings();

// Ambos rankings calculados com mesmos preços
// Ambos salvos no banco simultaneamente
```

### Consulta no Frontend

```typescript
// O store já faz o fetch automaticamente
const { competitors, isLoading, lastUpdate } = useRankingStore();

// isLoading controla quando mostrar loading vs conteúdo
```

## Observações Importantes

- **Preços consistentes**: Ambos rankings sempre usam exatamente os mesmos preços
- **Cálculo único**: Dados carregados uma vez, cálculos feitos em sequência
- **Salvamento simultâneo**: Ambos rankings salvos no banco ao mesmo tempo
- **Loading adequado**: Frontend aguarda request antes de exibir conteúdo

## Próximos Passos Sugeridos

1. **Métricas**: Adicionar métricas de tempo de cálculo
2. **Cache**: Considerar cache de preços durante cálculo
3. **Otimização**: Paralelizar cálculos de assets quando possível
4. **Testes**: Adicionar testes unitários para garantir consistência

## Conclusão

A implementação garante que os rankings mensal e anual sejam sempre calculados com os mesmos preços, eliminando inconsistências e melhorando a experiência do usuário com loading adequado.




