# Ajuste de Copy e Fluxo de Checkout para Usuários Logados

## Data: 09/01/2026

## Resumo
Ajustes no copy do banner de conversão e otimização do fluxo de checkout para pular o modal quando o usuário já está logado, usando o email da conta diretamente.

## Problemas Identificados

1. **Copy desatualizado**: O banner ainda mencionava "participar da comunidade e prêmios", mas agora a participação no ranking é gratuita. O pagamento destrava carteiras de todos os usuários e premiação.

2. **Fluxo redundante para usuários logados**: O modal de captura de email aparecia mesmo quando o usuário já estava logado, adicionando um passo desnecessário ao fluxo de checkout.

## Soluções Implementadas

### 1. Atualização do Copy do Banner

**Você deve** focar o copy em desbloquear funcionalidades premium (carteiras de outros usuários e premiação), não em participar do ranking (que já é gratuito).

**Você NÃO deve** mencionar "participar" ou "comece a pontuar" como benefício premium, pois isso já está disponível gratuitamente.

**Mudanças realizadas**:

**Antes**:
```
"Comece a pontuar agora e participe da comunidade e prêmios"
```

**Depois**:
```
"Desbloqueie carteiras de todos os usuários e participe dos prêmios. Ou entre agora e participe da competição gratuitamente"
```

O copy agora menciona ambas as opções:
- **Premium**: Desbloqueia carteiras de todos os usuários e participa dos prêmios
- **Gratuito**: Participa da competição sem custo (sem premiação)

**Botão atualizado**:
- Antes: "Participar"
- Depois: "Desbloquear Premium"

### 2. Otimização do Fluxo de Checkout

**Você deve** verificar se o usuário está logado antes de abrir o modal de captura de email.

**Você deve** usar o email da conta logada diretamente e pular o modal quando o usuário já estiver autenticado.

**Você NÃO deve** mostrar o modal de captura de email para usuários já logados.

**Implementação**:

O componente `CheckoutCTA` foi modificado para:

1. Verificar autenticação usando `useAuth()`
2. Se usuário estiver logado:
   - Criar lead automaticamente (se necessário) via API
   - Redirecionar diretamente para checkout Kiwify com email da conta
   - Pular o modal completamente
3. Se usuário não estiver logado:
   - Abrir modal `LeadCaptureModal` normalmente
   - Capturar email e nome
   - Redirecionar para checkout após captura

**Código implementado**:

```typescript
const handleClick = () => {
  // Se usuário estiver logado, usar email da conta e pular modal
  if (isAuthenticated && user?.email) {
    // Criar lead se necessário e redirecionar direto para checkout
    fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email.trim(),
        name: user.name || undefined,
        source,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Se lead já existe e é premium, não fazer nada
        if (data.action === 'send_magic_link') {
          return;
        }
        // Redirecionar para checkout com email do usuário logado
        redirectToKiwifyCheckout(user.email, source);
      })
      .catch((error) => {
        console.error('Error creating lead:', error);
        // Mesmo com erro, redirecionar para checkout
        redirectToKiwifyCheckout(user.email, source);
      });
  } else {
    // Usuário não logado, abrir modal para capturar email
    setIsModalOpen(true);
  }
};
```

## Benefícios

1. **Melhor UX**: Usuários logados têm um fluxo mais rápido, sem passo desnecessário
2. **Copy mais claro**: Mensagem focada nos benefícios reais do premium
3. **Menos fricção**: Redução de um passo no processo de checkout para usuários autenticados
4. **Consistência**: Email sempre vem da conta logada, garantindo vinculação correta

## Arquivos Modificados

- `src/components/ranking/ConversionBanner.tsx`
  - Atualizado copy do banner
  - Atualizado texto do botão

- `src/components/checkout/CheckoutCTA.tsx`
  - Adicionada verificação de autenticação
  - Implementada lógica para pular modal quando logado
  - Adicionado import de `useAuth` e `redirectToKiwifyCheckout`

## Fluxo Atualizado

### Usuário Não Logado

1. Clica em "Desbloquear Premium"
2. Modal `LeadCaptureModal` abre
3. Preenche email (e nome opcional)
4. Sistema cria lead via `/api/leads`
5. Redireciona para checkout Kiwify com email informado

### Usuário Logado

1. Clica em "Desbloquear Premium"
2. Sistema verifica autenticação
3. Cria lead automaticamente com email da conta (se necessário)
4. Redireciona diretamente para checkout Kiwify com email da conta
5. **Modal não aparece** (um passo a menos)

## Observações

- O componente `CheckoutSection` na página de perfil já tinha lógica similar, mas agora o `CheckoutCTA` faz isso automaticamente para todos os usos
- O email sempre vem da conta logada, garantindo que a assinatura seja vinculada corretamente ao usuário
- Se o usuário já for premium, o sistema detecta via API e não redireciona para checkout

