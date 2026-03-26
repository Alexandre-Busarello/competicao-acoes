# Pré-preenchimento de Email no Checkout Kiwify

## Data: 09/01/2026

## Resumo
Documentação sobre como o email do usuário é pré-preenchido automaticamente no checkout do Cakto através de query parameters na URL.

## Funcionalidade

**Sim, é possível passar o email para a página de produto do Kiwify para que ele já venha preenchido.**

A Kiwify suporta pré-preenchimento de campos do checkout através de query parameters na URL. O código já está implementado e funcionando.

## Como Funciona

### 1. Query Parameters Suportados pela Kiwify

Segundo a documentação oficial da Kiwify, os seguintes parâmetros podem ser passados na URL:

- `email` - Pré-preenche o campo de email
- `name` - Pré-preenche o campo de nome
- `cpf` - Pré-preenche o campo de CPF
- `phone` - Pré-preenche o campo de telefone
- `region` - Pré-preenche o campo de região

**Formato da URL**:
```
https://pay.kiwify.com.br/SEU_PRODUTO?email=usuario@exemplo.com&name=Nome%20Usuario
```

### 2. Implementação Atual

A função `redirectToKiwifyCheckout` em `src/lib/utils/checkout.ts` já implementa isso:

```typescript
export function redirectToKiwifyCheckout(email?: string, source?: string) {
  const kiwifyProductUrl = process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_URL;
  
  // Adicionar parâmetros de query se necessário
  const url = new URL(kiwifyProductUrl);
  
  if (email) {
    url.searchParams.set('email', email);
  }
  
  if (source) {
    url.searchParams.set('source', source);
  }

  // Redirecionar para checkout
  window.location.href = url.toString();
}
```

### 3. Quando o Email é Passado

O email é passado automaticamente em duas situações:

#### 3.1. Usuário Logado

Quando o usuário está logado e clica em um CTA de checkout:

1. `CheckoutCTA` detecta que usuário está autenticado
2. Usa o email da conta (`user.email`)
3. Chama `redirectToKiwifyCheckout(user.email, source)`
4. Email é adicionado como query parameter
5. Kiwify pré-preenche o campo automaticamente

**Exemplo de URL gerada**:
```
https://pay.kiwify.com.br/8oQrd43?email=usuario@exemplo.com&source=ranking_banner
```

#### 3.2. Usuário Não Logado (via Modal)

Quando o usuário não está logado:

1. Modal `LeadCaptureModal` captura email do usuário
2. Após criar lead, chama `redirectToKiwifyCheckout(email.trim(), source)`
3. Email informado pelo usuário é passado para Kiwify

## Benefícios

1. **Melhor UX**: Usuário não precisa digitar email novamente
2. **Menos erros**: Reduz chance de digitação incorreta
3. **Vinculação correta**: Garante que o email usado no checkout seja o mesmo da conta
4. **Conversão**: Reduz fricção no processo de checkout

## Exemplo de Uso

### Usuário Logado

```typescript
// Em CheckoutCTA.tsx
if (isAuthenticated && user?.email) {
  redirectToKiwifyCheckout(user.email, source);
  // URL gerada: https://pay.kiwify.com.br/PRODUTO?email=user@email.com&source=ranking_banner
}
```

### Usuário Não Logado

```typescript
// Em LeadCaptureModal.tsx
redirectToKiwifyCheckout(email.trim(), source);
// URL gerada: https://pay.kiwify.com.br/PRODUTO?email=user@email.com&source=checkout_cta
```

## Parâmetros Adicionais Disponíveis

Se necessário, podemos adicionar outros parâmetros suportados pela Kiwify:

```typescript
// Exemplo: adicionar nome também
if (email) {
  url.searchParams.set('email', email);
}

if (name) {
  url.searchParams.set('name', name);
}
```

## Verificação

Para verificar se está funcionando:

1. Faça login na aplicação
2. Clique em qualquer CTA de checkout
3. Verifique a URL do Kiwify no navegador
4. Confirme que o campo de email está pré-preenchido

## Referências

- [Documentação Kiwify - Preencher campos pela URL](https://ajuda.kiwify.com.br/pt-br/article/como-preencher-os-campos-do-checkout-pela-url-de7ezo/)

## Observações

- O parâmetro `source` é usado apenas para tracking interno, não afeta o Kiwify
- O email deve ser válido para funcionar corretamente
- A funcionalidade funciona tanto para usuários logados quanto não logados
- O código já está implementado e funcionando corretamente

