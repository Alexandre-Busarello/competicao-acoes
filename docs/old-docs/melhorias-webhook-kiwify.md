# Melhorias no Webhook da Kiwify

## Data: 09/01/2026

## Resumo
Implementação de melhorias no webhook da Kiwify para tratar chargebacks, garantir criação de conta e ativação de premium, e melhorar o tratamento de cancelamentos.

## Problemas Identificados

1. **Falta de tratamento para chargebacks**: O webhook não tratava eventos de chargeback, deixando usuários com premium ativo mesmo após chargeback
2. **Criação de lead**: Não criava lead automaticamente quando não existia
3. **Garantia de ativação de premium**: Precisava garantir que sempre ativa premium quando recebe compra confirmada, mesmo se conta já existir
4. **Tratamento de cancelamentos**: Precisava garantir remoção de premium mesmo quando não há subscription ativa

## Soluções Implementadas

### 1. Tratamento de Chargebacks

**Você deve** tratar os seguintes eventos de chargeback:
- `order.chargeback`
- `chargeback.created`

**Você NÃO deve** ignorar esses eventos, pois eles indicam que o pagamento foi contestado e o premium deve ser removido.

**Implementação**:
```typescript
// Processar eventos que removem premium: reembolso, chargeback e cancelamento
if (
  event === 'order.refunded' ||
  event === 'order.chargeback' ||
  event === 'chargeback.created' ||
  event === 'subscription.cancelled'
) {
  // Remove premium do usuário
}
```

### 2. Função Auxiliar para Remover Premium

Criada função `removePremiumFromUser()` que:
- **Você deve** sempre remover `isPremium: false` do usuário, mesmo se não tiver subscription
- **Você deve** cancelar a subscription se existir
- **Você NÃO deve** falhar se o usuário não tiver subscription

**Implementação**:
```typescript
async function removePremiumFromUser(email: string) {
  const emailLower = email.toLowerCase().trim();
  
  const user = await prisma.user.findUnique({
    where: { email: emailLower },
    include: { subscription: true },
  });

  if (user) {
    // Atualizar subscription se existir
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: 'canceled',
          updatedAt: new Date(),
        },
      });
    }

    // Sempre remover premium do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: false,
      },
    });

    return true;
  }

  return false;
}
```

### 3. Criação Automática de Lead

**Você deve** criar lead automaticamente quando recebe `order.paid` ou `order.completed` e o lead não existe.

**Você deve** marcar o lead como convertido imediatamente ao criar.

**Implementação**:
```typescript
// Verificar se existe lead com esse email
let lead = await prisma.lead.findUnique({
  where: { email: emailLower },
});

// Criar lead se não existir ou marcar como convertido se existir
if (!lead) {
  // Criar lead e marcar como convertido imediatamente
  lead = await prisma.lead.create({
    data: {
      email: emailLower,
      converted: true,
      convertedAt: new Date(),
    },
  });
} else if (!lead.converted) {
  // Marcar lead existente como convertido
  lead = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      converted: true,
      convertedAt: new Date(),
    },
  });
}
```

### 4. Garantia de Criação de Conta e Ativação de Premium

**Você deve** sempre criar conta do usuário se não existir quando recebe `order.paid` ou `order.completed`.

**Você deve** sempre usar a conta existente pelo email (email é a chave entre Kiwify e aplicação).

**Você deve** sempre ativar premium (`isPremium: true`) quando recebe compra confirmada.

**Você NÃO deve** criar múltiplas contas para o mesmo email.

**Fluxo implementado**:
1. Verifica se lead existe → cria se não existir e marca como convertido
2. Verifica se usuário existe no banco por email → usa se existir, cria se não existir
3. Verifica se usuário existe no Supabase Auth por email → sincroniza ou cria
4. Cria ou atualiza subscription com status `active`
5. Atualiza `isPremium: true` baseado na subscription

### 5. Eventos Tratados

O webhook agora trata os seguintes eventos:

**Eventos que ATIVAM premium**:
- `order.paid`: Compra confirmada
- `order.completed`: Compra completada

**Eventos que REMOVEM premium**:
- `order.refunded`: Reembolso
- `order.chargeback`: Chargeback
- `chargeback.created`: Chargeback criado
- `subscription.cancelled`: Assinatura cancelada

## Regras Importantes

### Email como Chave Principal

**Você deve** sempre usar o email como chave principal entre Kiwify e a aplicação.

**Você deve** sempre normalizar o email (lowercase + trim) antes de usar como chave.

**Você NÃO deve** criar múltiplas contas para o mesmo email.

### Criação de Conta

**Você deve** criar conta completa quando recebe compra confirmada:
1. Criar lead (se não existir) e marcar como convertido
2. Criar usuário no banco (se não existir)
3. Criar usuário no Supabase Auth (se não existir)
4. Criar subscription com status `active`
5. Ativar premium (`isPremium: true`)

### Remoção de Premium

**Você deve** sempre remover premium quando recebe eventos de cancelamento/reembolso/chargeback.

**Você deve** cancelar subscription se existir.

**Você NÃO deve** falhar se usuário não tiver subscription (pode ter sido removida anteriormente).

## Arquivos Modificados

- `src/app/api/webhooks/kiwify/route.ts`

## Testes Recomendados

1. **Teste de criação de conta**: Enviar webhook `order.paid` com email novo → deve criar lead, usuário e ativar premium
2. **Teste de conta existente**: Enviar webhook `order.paid` com email existente → deve usar conta existente e ativar premium
3. **Teste de chargeback**: Enviar webhook `order.chargeback` → deve remover premium
4. **Teste de cancelamento**: Enviar webhook `subscription.cancelled` → deve remover premium mesmo sem subscription

## Observações

- O webhook continua enviando magic link após criar/atualizar usuário
- A autenticação do webhook continua funcionando com `KIWIFY_WEBHOOK_SECRET`
- O modo de teste (`ALLOW_TEST_WEBHOOK=true`) continua funcionando em desenvolvimento

