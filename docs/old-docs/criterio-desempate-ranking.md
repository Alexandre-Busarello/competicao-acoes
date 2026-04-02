# Critério de Desempate no Ranking

## Data
2025-01-08

## Resumo
Implementação do critério de desempate para o ranking quando dois ou mais participantes têm a mesma rentabilidade (ou muito próxima). O sistema agora considera quatro critérios em cascata: número de ativos diferentes na carteira, data da última transação, e data de criação da conta. Cada critério tem um motivo claro explicado na página "Como Funciona" para transparência total com os participantes.

## Problema Identificado

Quando dois ou mais participantes têm exatamente a mesma rentabilidade percentual, o ranking não tinha um critério claro de desempate, podendo gerar inconsistências na ordenação.

## Solução Implementada

### Critérios de Desempate (em ordem de prioridade)

1. **Rentabilidade**: Participantes são ordenados primeiro por rentabilidade (do maior para o menor)
2. **Número de ativos**: Se a rentabilidade for igual (diferença menor que 0,01%), quem tem mais ativos diferentes na carteira fica à frente
3. **Última transação**: Se ainda houver empate no número de ativos, quem lançou transações há menos tempo fica à frente
4. **Data de criação da conta**: Se ainda houver empate, quem tem a conta criada há mais tempo fica à frente

### Implementação Técnica

#### 1. Adição dos campos de desempate ao `RankingEntryForStorage`

```typescript
export type RankingEntryForStorage = Omit<RankingEntry, 'name' | 'avatar'> & {
  lastTransactionDate?: Date; // Data da última transação (para critério de desempate)
  accountCreatedAt?: Date; // Data de criação da conta (para critério de desempate)
};
```

#### 2. Cálculo das datas para critérios de desempate

Durante o processamento de cada usuário, o sistema calcula:

- **Data da última transação**: Data da transação mais recente (usando `createdAt`)
- **Data de criação da conta**: Data de criação do usuário (usando `user.createdAt`)

```typescript
// Calcular data da última transação (para critério de desempate)
const lastTransactionDate = userTransactions.length > 0
  ? new Date(Math.max(...userTransactions.map(tx => tx.createdAt.getTime())))
  : new Date();

// Data de criação da conta (para critério de desempate)
const accountCreatedAt = user.createdAt;
```

#### 3. Função de ordenação atualizada

A ordenação agora considera quatro critérios em cascata:

```typescript
monthlyRankings.sort((a, b) => {
  // Critério 1: Rentabilidade
  if (Math.abs(b.monthlyReturn - a.monthlyReturn) > 0.01) {
    return b.monthlyReturn - a.monthlyReturn;
  }
  // Critério 2: Número de ativos
  const aAssetsCount = a.portfolio?.length || 0;
  const bAssetsCount = b.portfolio?.length || 0;
  if (aAssetsCount !== bAssetsCount) {
    return bAssetsCount - aAssetsCount;
  }
  // Critério 3: Data da última transação (mais recente ganha)
  const aLastDate = a.lastTransactionDate?.getTime() || 0;
  const bLastDate = b.lastTransactionDate?.getTime() || 0;
  if (aLastDate !== bLastDate) {
    return bLastDate - aLastDate;
  }
  // Critério 4: Data de criação da conta (mais antiga ganha)
  const aAccountDate = a.accountCreatedAt?.getTime() || 0;
  const bAccountDate = b.accountCreatedAt?.getTime() || 0;
  return aAccountDate - bAccountDate;
});
```

### Locais Atualizados

A ordenação foi atualizada em três métodos do `RankingService`:

1. `calculateBothRankingsWithCheckpoint()` - Ordenação mensal e anual com 4 critérios
2. `calculateBothRankings()` - Ordenação mensal e anual com 4 critérios
3. `calculateRanking()` - Ordenação para ambos os períodos com 4 critérios

Todos os métodos agora incluem o campo `accountCreatedAt` no `baseEntry` e consideram os 4 critérios de desempate.

### Exemplo Prático

**Cenário 1**: Dois participantes têm exatamente +10,00% de rentabilidade

- **Participante A**: 3 ativos diferentes (PETR4, VALE3, ITUB4), última transação há 2 horas
- **Participante B**: 2 ativos diferentes (PETR4, VALE3), última transação há 1 hora

**Resultado**: Participante A fica à frente porque tem mais ativos (3 > 2), mesmo que a última transação seja mais antiga.

**Cenário 2**: Ambos têm 3 ativos

- **Participante A**: Última transação há 2 horas, conta criada em 01/01/2025
- **Participante B**: Última transação há 1 hora, conta criada em 15/01/2025

**Resultado**: Participante B fica à frente porque lançou transações mais recentemente (critério 3).

**Cenário 3**: Ambos têm 3 ativos e mesma data de última transação

- **Participante A**: Conta criada em 01/01/2025
- **Participante B**: Conta criada em 15/01/2025

**Resultado**: Participante A fica à frente porque tem a conta há mais tempo (critério 4).

## Atualização da Página "Como Funciona"

A página `/como-funciona` foi atualizada para incluir:

1. **Seção sobre critério de desempate** na parte de "Posicionamento no Ranking" com:
   - Lista completa dos 4 critérios de desempate
   - **Motivo de cada critério** explicado detalhadamente:
     - **Número de ativos**: Incentiva diversificação da carteira
     - **Última transação**: Valoriza atividade recente e engajamento
     - **Data de criação da conta**: Reconhece fidelidade e comprometimento de longo prazo
   - Exemplo prático completo mostrando todos os critérios em ação
2. **Explicação detalhada sobre cálculo de rentabilidade com vendas** na seção de "Cálculo da Rentabilidade"
3. **Exemplo prático** de como funciona o cálculo quando há vendas e encerramento de posições

### Detalhes sobre Vendas e Encerramento de Posições

A documentação agora explica claramente:

- **Valor Investido**: Soma apenas das compras realizadas (não inclui vendas)
- **Valor Atual**: Soma do valor atual das posições em carteira + dinheiro recebido em vendas
- **Vendas**: Quando você vende ações, o dinheiro recebido é incluído no valor atual da carteira
- **Encerramento de posições**: Quando você vende todas as ações de um ativo, o dinheiro recebido continua contando para o valor atual

## Impacto

- **Consistência**: O ranking agora tem uma ordem determinística mesmo quando há empates
- **Transparência**: Os critérios de desempate estão claramente documentados para os usuários, incluindo os motivos de cada critério
- **Justiça**: O critério favorece:
  - Diversificação (mais ativos)
  - Atividade recente (última transação)
  - Fidelidade e comprometimento de longo prazo (conta mais antiga)

## Notas Técnicas

- A tolerância de 0.01% para considerar rentabilidades "iguais" evita problemas de precisão de ponto flutuante
- O número de ativos é calculado usando `portfolio.length`, que conta apenas ativos com quantidade > 0
- A data da última transação usa `createdAt` (quando a transação foi registrada no sistema), não `date` (data da operação)
- A data de criação da conta usa `user.createdAt` do modelo User do Prisma
- O critério 4 (conta mais antiga) favorece quem está na plataforma há mais tempo, reconhecendo fidelidade e comprometimento

