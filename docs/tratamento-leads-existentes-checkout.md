# Tratamento de Leads Existentes no Fluxo de Checkout

## Data: 09/01/2026

## Objetivo

Implementar lógica inteligente para lidar com leads existentes no fluxo de checkout:
1. Se o lead já existe e não é premium → redirecionar para checkout
2. Se o lead já existe e foi convertido (premium) → enviar magic link e informar na UX/UI
3. Não atualizar leads existentes, apenas verificar status

## Problema Identificado

O sistema atualizava leads existentes sempre que um usuário tentava se cadastrar novamente no fluxo de checkout, mesmo quando o lead já havia sido convertido. Isso causava:
- Atualizações desnecessárias no banco de dados
- Falta de tratamento adequado para usuários premium que tentavam acessar o checkout novamente
- Ausência de feedback visual quando um usuário premium tentava fazer checkout

## Solução Implementada

### 1. Modificação da API de Leads (`src/app/api/leads/route.ts`)

**Mudanças Principais**:

- **Removida atualização automática**: O sistema não atualiza mais leads existentes
- **Verificação de status**: Verifica se o lead foi convertido e se existe um usuário premium associado
- **Resposta estruturada**: Retorna informações sobre o status do lead e ação recomendada

**Lógica Implementada**:

1. **Lead não existe**: Cria novo lead e retorna `action: 'redirect_checkout'`
2. **Lead existe mas não é premium**: Retorna lead existente com `action: 'redirect_checkout'`
3. **Lead existe e é premium**: Verifica se existe usuário premium e retorna `action: 'send_magic_link'`

**Verificação de Premium**:
- Verifica se existe `User` com o email fornecido
- Verifica se `user.isPremium === true` OU
- Verifica se existe `subscription` ativa (status === 'active' e não expirada)

**Estrutura de Resposta**:
```typescript
{
  success: true,
  lead: Lead,
  userExists: boolean,
  isPremium: boolean,
  action: 'redirect_checkout' | 'send_magic_link',
  message: string
}
```

### 2. Atualização do LeadCaptureModal (`src/components/checkout/LeadCaptureModal.tsx`)

**Mudanças Principais**:

- **Tratamento de diferentes ações**: Lida com `redirect_checkout` e `send_magic_link`
- **Estado de magic link enviado**: Novo estado `magicLinkSent` para controlar UI
- **Feedback visual**: Tela de sucesso quando magic link é enviado
- **Integração com API de magic link**: Chama `/api/auth/magic-link` quando necessário

**Fluxo Implementado**:

1. Usuário preenche email e nome (opcional)
2. Sistema verifica status via `/api/leads`
3. **Se `action === 'send_magic_link'`**:
   - Chama `/api/auth/magic-link` para enviar link de acesso
   - Mostra tela de sucesso com mensagem informativa
   - Usuário fecha o modal após ler a mensagem
4. **Se `action === 'redirect_checkout'`**:
   - Redireciona para checkout Kiwify (comportamento original)

**Tela de Sucesso**:
- Ícone de email em destaque
- Mensagem clara informando que o link foi enviado
- Exibe o email para confirmação
- Botão "Entendi" para fechar o modal

**Reset de Estado**:
- Função `handleClose` limpa todos os estados ao fechar o modal
- Garante que o modal sempre comece limpo ao ser reaberto

## Fluxo Completo

### Cenário 1: Lead Novo

1. Usuário preenche email no modal
2. Sistema cria novo lead no banco
3. Retorna `action: 'redirect_checkout'`
4. Redireciona para checkout Kiwify

### Cenário 2: Lead Existente Não Premium

1. Usuário preenche email no modal
2. Sistema encontra lead existente
3. Verifica que não há usuário premium
4. Retorna `action: 'redirect_checkout'`
5. Redireciona para checkout Kiwify

### Cenário 3: Lead Existente Premium

1. Usuário preenche email no modal
2. Sistema encontra lead existente
3. Verifica que existe usuário premium
4. Retorna `action: 'send_magic_link'`
5. Sistema chama `/api/auth/magic-link`
6. Magic link é enviado para o email
7. Mostra tela de sucesso informando o usuário
8. Usuário fecha o modal após ler

## Componentes Utilizados

### `LeadCaptureModal`
- Modal de captura de lead atualizado
- Gerencia estados de loading, erro e sucesso
- Integra com API de leads e magic link

### `redirectToKiwifyCheckout`
- Função utilitária para redirecionamento
- Mantém comportamento original

### `/api/auth/magic-link`
- Endpoint existente para envio de magic links
- Reutilizado para usuários premium

## Arquivos Modificados

1. **Modificado**: `src/app/api/leads/route.ts`
   - Removida lógica de atualização de leads existentes
   - Adicionada verificação de status do lead e usuário
   - Adicionada verificação de premium
   - Estrutura de resposta atualizada

2. **Modificado**: `src/components/checkout/LeadCaptureModal.tsx`
   - Adicionado estado `magicLinkSent`
   - Adicionada lógica para lidar com diferentes ações
   - Adicionada integração com API de magic link
   - Adicionada tela de sucesso para magic link
   - Adicionada função `handleClose` para reset de estado
   - Removido import não utilizado (`CheckCircle2`)

## Design e UX

### Princípios Aplicados

1. **Não intrusivo**: Não atualiza dados sem necessidade
2. **Informativo**: Usuário sempre sabe o que está acontecendo
3. **Clareza**: Mensagens diretas e objetivas
4. **Feedback visual**: Tela de sucesso clara quando magic link é enviado
5. **Consistência**: Mantém padrões visuais existentes

### Estados Visuais

- **Formulário normal**: Campos de email e nome, botão de submit
- **Loading**: Spinner e texto "Processando..."
- **Erro**: Mensagem de erro em destaque (vermelho)
- **Sucesso (magic link)**: Ícone de email, mensagem informativa, botão "Entendi"

### Mensagens

- **Magic link enviado**: "Link de acesso enviado! Enviamos um link de acesso para [email]. Verifique sua caixa de entrada e clique no link para acessar sua conta premium."
- **Erro genérico**: Mensagens de erro da API são exibidas diretamente

## Benefícios

1. **Performance**: Reduz atualizações desnecessárias no banco de dados
2. **UX melhorada**: Usuários premium recebem feedback adequado
3. **Segurança**: Não sobrescreve dados de leads existentes
4. **Rastreabilidade**: Mantém histórico original dos leads
5. **Eficiência**: Reutiliza endpoints existentes (magic link)

## Casos de Uso

### Caso 1: Usuário Premium Tentando Fazer Checkout Novamente
- **Comportamento**: Recebe magic link e mensagem informativa
- **Benefício**: Evita checkout duplicado e informa sobre conta existente

### Caso 2: Lead Não Convertido Tentando Novamente
- **Comportamento**: Redirecionado para checkout normalmente
- **Benefício**: Permite completar compra iniciada anteriormente

### Caso 3: Novo Usuário
- **Comportamento**: Cria lead e redireciona para checkout
- **Benefício**: Fluxo normal mantido

## Notas Técnicas

- A verificação de premium considera tanto `user.isPremium` quanto `subscription.status === 'active'`
- O sistema não atualiza o campo `checkoutStarted` em leads existentes
- O magic link é enviado via Supabase Auth usando `signInWithOtp`
- O modal sempre reseta seus estados ao ser fechado
- A validação de email ocorre antes de qualquer chamada à API

## Próximos Passos (Opcional)

1. **Analytics**: Rastrear quantos leads premium tentam fazer checkout novamente
2. **Mensagens personalizadas**: Diferentes mensagens baseadas no tempo desde a conversão
3. **Lembrete de assinatura**: Para leads não premium que tentam novamente após muito tempo
4. **Testes**: Adicionar testes unitários para os diferentes cenários

