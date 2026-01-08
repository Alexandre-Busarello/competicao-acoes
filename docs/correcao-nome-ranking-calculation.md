# Correção: Nome não deve ser salvo em RankingCalculation

## Data
2025-01-XX

## Problema Identificado

O nome do usuário estava sendo salvo diretamente no campo `rankingData` da tabela `RankingCalculation`, assim como o avatar estava sendo salvo anteriormente. Isso causava:

1. **Dados desatualizados**: Quando um usuário alterava seu nome no perfil, o ranking continuava exibindo o nome antigo
2. **Inconsistência**: O nome no ranking não refletia as alterações feitas pelo usuário
3. **Duplicação de dados**: O nome estava sendo armazenado tanto na tabela `User` quanto no `RankingCalculation`

## Solução Implementada

Assim como foi feito com o avatar, o nome agora não é mais salvo no `RankingCalculation` e é sempre buscado da tabela `User` quando o ranking é recuperado.

### Mudanças Realizadas

#### 1. Tipos TypeScript

Foram criados novos tipos para diferenciar dados salvos no banco dos dados enriquecidos:

```typescript
// Tipo para salvar no banco (sem name e avatar)
export type RankingEntryForStorage = Omit<RankingEntry, 'name' | 'avatar'>;

export interface RankingResultForStorage {
  period: 'mensal' | 'anual';
  lastUpdate: Date;
  ranking: RankingEntryForStorage[];
  totalParticipants: number;
}
```

#### 2. Remoção do Nome ao Salvar

Nos métodos `calculateBothRankings()` e `calculateRanking()`, o nome foi removido dos dados salvos:

**Antes**:
```typescript
const baseEntry = {
  userId: user.id,
  name: user.name,  // ❌ Nome sendo salvo
  rank: 0,
  // ...
};
```

**Depois**:
```typescript
const baseEntry = {
  userId: user.id,
  // name e avatar não são salvos aqui - serão buscados da tabela User ao listar
  rank: 0,
  // ...
};
```

#### 3. Método de Enriquecimento Atualizado

O método `enrichRankingWithAvatars()` foi renomeado e atualizado para `enrichRankingWithUserData()`, agora buscando tanto nome quanto avatar:

**Antes**:
```typescript
private async enrichRankingWithAvatars(ranking: RankingResult): Promise<RankingResult> {
  // Buscava apenas avatarUrl
  const users = await prisma.user.findMany({
    select: {
      id: true,
      avatarUrl: true,
    },
  });
  // ...
}
```

**Depois**:
```typescript
private async enrichRankingWithUserData(ranking: RankingResult | RankingResultForStorage): Promise<RankingResult> {
  // Busca nome e avatarUrl
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  });
  
  // Cria mapas para nome e avatar
  const nameMap = new Map(users.map(u => [u.id, u.name]));
  const avatarMap = new Map(users.map(u => [u.id, u.avatarUrl || undefined]));
  
  // Enriquece ranking com ambos
  const enrichedRanking: RankingEntry[] = ranking.ranking.map(entry => ({
    ...entry,
    name: nameMap.get(entry.userId) || 'Usuário',
    avatar: avatarMap.get(entry.userId),
  }));
  // ...
}
```

#### 4. Fluxo de Salvamento e Recuperação

**Ao Calcular Ranking**:
1. Calcula dados do ranking sem `name` e `avatar`
2. Salva no banco como `RankingResultForStorage`
3. Enriquece com dados da tabela `User` antes de retornar
4. Atualiza cache com dados enriquecidos

**Ao Recuperar Ranking**:
1. Busca dados do banco (sem `name` e `avatar`)
2. Enriquece com dados atualizados da tabela `User`
3. Retorna ranking completo com nome e avatar atualizados

## Benefícios

1. **Dados sempre atualizados**: Nome e avatar sempre refletem o estado atual da tabela `User`
2. **Consistência**: Alterações no perfil são imediatamente refletidas no ranking
3. **Fonte única de verdade**: Tabela `User` é a única fonte para nome e avatar
4. **Redução de duplicação**: Não há mais dados duplicados no `RankingCalculation`

## Arquivos Modificados

1. **`src/lib/services/ranking-service.ts`**
   - Adicionados tipos `RankingEntryForStorage` e `RankingResultForStorage`
   - Removido `name` dos dados salvos em `calculateBothRankings()` e `calculateRanking()`
   - Renomeado `enrichRankingWithAvatars()` para `enrichRankingWithUserData()`
   - Atualizado método para buscar nome e avatar da tabela `User`
   - Atualizado `getRanking()` para usar tipos corretos

## Compatibilidade

- Rankings antigos salvos no banco ainda funcionam: o método `enrichRankingWithUserData()` busca nome e avatar mesmo se os dados antigos já contiverem esses campos
- Cache é atualizado automaticamente com dados enriquecidos
- Frontend não precisa de alterações: continua recebendo `RankingEntry` com `name` e `avatar`

## Testes Recomendados

1. Alterar nome do perfil e verificar se ranking é atualizado
2. Alterar avatar do perfil e verificar se ranking é atualizado
3. Verificar que rankings antigos ainda funcionam corretamente
4. Verificar que cálculos novos não salvam nome e avatar no banco

