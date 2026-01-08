# Correção de Erro no Webhook de Teste da Kiwify

## Data
2025-01-XX

## Resumo
Este documento descreve a correção do erro de constraint única (`kiwifyId`) que ocorria ao testar o webhook da Kiwify com múltiplos emails diferentes.

## Problema Identificado

### Erro
```
Unique constraint failed on the fields: (`kiwifyId`)
```

### Causa Raiz
O webhook de teste (`/api/webhooks/kiwify/test`) estava usando um valor fixo `'test-subscription-id'` para o campo `kiwifyId` em todas as execuções. Como o campo `kiwifyId` possui uma constraint `@unique` no schema do Prisma, ao tentar criar uma segunda subscription de teste com um email diferente, o Prisma tentava criar uma nova subscription com o mesmo `kiwifyId`, violando a constraint única.

### Contexto Técnico
- O schema define `kiwifyId` como `String? @unique` na tabela `Subscription`
- O `upsert` usa `where: { userId: user.id }` como chave única
- Quando o `upsert` tenta criar uma nova subscription (não existe para aquele `userId`), ele tenta inserir um `kiwifyId` que já existe em outra subscription, causando o erro

## Solução Implementada

### Mudança Realizada
Modificado o código para gerar um `kiwifyId` único baseado no `userId` de cada usuário, garantindo que cada subscription de teste tenha um identificador único.

### Código Antes
```typescript
const subscription = await prisma.subscription.upsert({
  where: { userId: user.id },
  update: {
    kiwifyId: 'test-subscription-id', // Valor fixo
    kiwifyOrderId: `test-order-${Date.now()}`,
    // ...
  },
  create: {
    userId: user.id,
    kiwifyId: 'test-subscription-id', // Valor fixo - causava conflito
    kiwifyOrderId: `test-order-${Date.now()}`,
    // ...
  },
});
```

### Código Depois
```typescript
// Gerar IDs únicos baseados no userId para evitar conflitos de constraint única
const testKiwifyId = `test-subscription-${user.id}`;
const testKiwifyOrderId = `test-order-${user.id}-${Date.now()}`;

const subscription = await prisma.subscription.upsert({
  where: { userId: user.id },
  update: {
    kiwifyId: testKiwifyId, // Único por usuário
    kiwifyOrderId: testKiwifyOrderId,
    // ...
  },
  create: {
    userId: user.id,
    kiwifyId: testKiwifyId, // Único por usuário
    kiwifyOrderId: testKiwifyOrderId,
    // ...
  },
});
```

## Arquivos Modificados

1. `src/app/api/webhooks/kiwify/test/route.ts`
   - Linhas 122-139: Modificado para gerar `kiwifyId` único baseado no `userId`

## Benefícios da Correção

1. **Elimina conflitos de constraint única**: Cada subscription de teste agora tem um `kiwifyId` único
2. **Permite múltiplos testes**: É possível testar o webhook com vários emails diferentes sem erros
3. **Mantém rastreabilidade**: O `kiwifyId` ainda identifica claramente que é uma subscription de teste, mas de forma única por usuário
4. **Não afeta produção**: A correção é apenas no endpoint de teste, não afeta o webhook real da Kiwify

## Teste da Correção

### Comando de Teste
```bash
curl -X POST https://competicao-acoes.vercel.app/api/webhooks/kiwify/test \
  -H "Content-Type: application/json" \
  -d '{"email": "dalac80921@atinjo.com"}'
```

### Resultado Esperado
- ✅ Subscription criada/atualizada com sucesso
- ✅ `kiwifyId` único gerado: `test-subscription-{userId}`
- ✅ Sem erros de constraint única
- ✅ Possibilidade de testar com múltiplos emails diferentes

## Observações Importantes

1. **Ambiente de Produção**: O webhook de teste ainda requer a variável `ALLOW_TEST_WEBHOOK` configurada para funcionar em produção
2. **Webhook Real**: O webhook real da Kiwify (`/api/webhooks/kiwify/route.ts`) não foi afetado e continua funcionando normalmente
3. **IDs de Teste**: Os IDs gerados seguem o padrão `test-subscription-{userId}` e `test-order-{userId}-{timestamp}`, facilitando identificação em logs

## Lições Aprendidas

1. **Constraints Únicas**: Ao usar campos com constraint `@unique`, sempre garantir que os valores sejam únicos, especialmente em ambientes de teste
2. **Testes Repetitivos**: Em endpoints de teste, usar valores dinâmicos baseados em identificadores únicos (como `userId`) ao invés de valores fixos
3. **Upsert com Constraints**: Ao fazer `upsert`, considerar que campos únicos podem causar conflitos se não forem tratados adequadamente

## Próximos Passos Recomendados

1. Considerar adicionar validação para garantir que `kiwifyId` seja sempre único antes de inserir/atualizar
2. Adicionar logs mais detalhados para facilitar debug de problemas similares no futuro
3. Documentar o padrão de IDs de teste para facilitar identificação em logs e monitoramento

