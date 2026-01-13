# Prevenção de Vendas a Descoberto

## Resumo

Foi implementada validação para prevenir vendas a descoberto (vender mais ativos do que o usuário possui). O sistema agora verifica a quantidade disponível antes de permitir uma venda e exibe mensagens de erro claras quando o usuário tenta vender mais do que possui.

## Implementação

### 1. Validação no Backend

**Arquivo:** `src/app/api/transactions/route.ts`

Foi adicionada validação no endpoint de criação de transações para verificar se o usuário possui quantidade suficiente antes de permitir uma venda:

```typescript
// Se for venda, verificar se o usuário tem quantidade suficiente
if (type === 'venda') {
  // Buscar todas as transações do usuário do ano atual
  const userTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Calcular posições atuais
  const positions = calculatePositions(transactions);
  
  // Encontrar posição atual do ticker
  const currentPosition = positions.find(
    pos => normalizeTickerForGrouping(pos.ticker) === normalizedTickerForPosition
  );

  const availableQuantity = currentPosition?.quantity || 0;

  // Verificar se a quantidade a vender não excede a disponível
  if (numQuantity > availableQuantity) {
    return NextResponse.json(
      { 
        error: 'Quantidade insuficiente para venda',
        availableQuantity,
        requestedQuantity: numQuantity,
        ticker: normalizedTicker,
      },
      { status: 400 }
    );
  }
}
```

**Características:**
- Busca apenas transações do ano atual (consistente com o filtro de ranking)
- Calcula posições atuais usando `calculatePositions()`
- Normaliza ticker para agrupar variações (ex: PETR4 e PETR4.SA)
- Retorna erro detalhado com quantidades disponíveis e solicitadas

### 2. Tratamento de Erro no Store

**Arquivo:** `src/lib/store/transactionStore.ts`

O store foi atualizado para preservar informações adicionais do erro:

```typescript
if (!response.ok) {
  const error = await response.json();
  // Criar erro customizado com informações adicionais
  const customError = new Error(error.error || 'Erro ao criar transação') as Error & {
    availableQuantity?: number;
    requestedQuantity?: number;
    ticker?: string;
  };
  customError.availableQuantity = error.availableQuantity;
  customError.requestedQuantity = error.requestedQuantity;
  customError.ticker = error.ticker;
  throw customError;
}
```

### 3. Mensagem de Erro no Frontend

**Arquivo:** `src/components/portfolio/TransactionModal.tsx`

O modal de transação foi atualizado para exibir mensagens de erro detalhadas:

```typescript
catch (error) {
  // Tratar erro de quantidade insuficiente com mensagem detalhada
  if (error instanceof Error && 'availableQuantity' in error) {
    const customError = error as Error & {
      availableQuantity?: number;
      requestedQuantity?: number;
      ticker?: string;
    };
    const availableQty = customError.availableQuantity ?? 0;
    const requestedQty = customError.requestedQuantity ?? numQuantity;
    const tickerName = customError.ticker || validation.ticker || ticker;
    
    setSubmitError(
      `Quantidade insuficiente para venda. Você possui ${availableQty.toLocaleString('pt-BR')} unidades de ${tickerName}, mas está tentando vender ${requestedQty.toLocaleString('pt-BR')} unidades.`
    );
  } else {
    setSubmitError(error instanceof Error ? error.message : 'Erro ao criar transação');
  }
}
```

**Exemplo de mensagem:**
> "Quantidade insuficiente para venda. Você possui 50 unidades de PETR4.SA, mas está tentando vender 100 unidades."

### 4. Exportação de Função Utilitária

**Arquivo:** `src/lib/utils/portfolio-calculator.ts`

A função `normalizeTickerForGrouping` foi exportada para uso no backend:

```typescript
export function normalizeTickerForGrouping(ticker: string): string {
  // Normaliza ticker para agrupar variações (ex: PETR4 e PETR4.SA)
  // ...
}
```

## Fluxo de Validação

1. Usuário tenta criar transação de venda
2. Backend recebe requisição com `type: 'venda'`
3. Sistema busca todas as transações do usuário do ano atual
4. Calcula posições atuais usando `calculatePositions()`
5. Normaliza ticker da venda para comparação
6. Encontra posição atual do ticker
7. Compara quantidade solicitada com quantidade disponível
8. Se quantidade solicitada > disponível:
   - Retorna erro 400 com detalhes
   - Frontend exibe mensagem clara com quantidades
9. Se quantidade solicitada <= disponível:
   - Transação é criada normalmente

## Casos de Teste

### Caso 1: Venda dentro do limite
- Usuário possui: 100 unidades de PETR4
- Tenta vender: 50 unidades
- Resultado: ✅ Transação criada com sucesso

### Caso 2: Venda exata do limite
- Usuário possui: 100 unidades de PETR4
- Tenta vender: 100 unidades
- Resultado: ✅ Transação criada com sucesso

### Caso 3: Venda acima do limite (a descoberto)
- Usuário possui: 50 unidades de PETR4
- Tenta vender: 100 unidades
- Resultado: ❌ Erro: "Quantidade insuficiente para venda. Você possui 50 unidades de PETR4.SA, mas está tentando vender 100 unidades."

### Caso 4: Venda de ativo sem posição
- Usuário possui: 0 unidades de VALE3
- Tenta vender: 10 unidades
- Resultado: ❌ Erro: "Quantidade insuficiente para venda. Você possui 0 unidades de VALE3.SA, mas está tentando vender 10 unidades."

### Caso 5: Normalização de ticker
- Usuário possui: 100 unidades de PETR4 (registrado como PETR4.SA)
- Tenta vender: 150 unidades usando ticker "PETR4"
- Resultado: ❌ Erro detecta corretamente que possui apenas 100 unidades

## Considerações Técnicas

### Normalização de Ticker

O sistema normaliza tickers para agrupar variações:
- `PETR4` → `PETR4.SA`
- `PETR4.SA` → `PETR4.SA`
- `VALE3` → `VALE3.SA`

Isso garante que vendas usando diferentes formatos do mesmo ticker sejam validadas corretamente.

### Filtro de Ano Atual

A validação considera apenas transações do ano atual, consistente com:
- Cálculo do ranking
- Exibição de transações na carteira
- Lógica geral da aplicação

### Precisão de Quantidades

O sistema usa `Decimal` do Prisma para garantir precisão em quantidades fracionadas (ex: criptomoedas), evitando problemas de arredondamento.

## Benefícios

1. **Segurança**: Previne vendas a descoberto que poderiam manipular rankings
2. **Integridade**: Garante que apenas posições reais sejam vendidas
3. **UX**: Mensagens claras informam exatamente o problema
4. **Consistência**: Usa a mesma lógica de cálculo de posições do ranking

## Testes Recomendados

Você deve testar:
1. Tentar vender mais do que possui e verificar mensagem de erro
2. Verificar que mensagem mostra quantidades corretas
3. Verificar que vendas dentro do limite funcionam normalmente
4. Testar com diferentes formatos de ticker (PETR4 vs PETR4.SA)
5. Testar com ativos que não possui (quantidade 0)
6. Verificar que validação considera apenas ano atual
7. Testar com quantidades fracionadas (se aplicável)

Você NÃO deve:
1. Permitir vendas a descoberto em nenhuma circunstância
2. Usar lógica diferente para validação e cálculo de posições
3. Mostrar mensagens genéricas sem detalhes das quantidades

## Arquivos Modificados

- `src/app/api/transactions/route.ts` - Adicionada validação de quantidade disponível
- `src/lib/store/transactionStore.ts` - Melhorado tratamento de erro com informações adicionais
- `src/components/portfolio/TransactionModal.tsx` - Melhorada exibição de mensagens de erro
- `src/lib/utils/portfolio-calculator.ts` - Exportada função `normalizeTickerForGrouping`

## Dependências

- `date-fns` - Para `startOfYear` e `endOfYear`
- `@prisma/client` - Para queries no banco
- `@/lib/utils/portfolio-calculator` - Para `calculatePositions` e `normalizeTickerForGrouping`








