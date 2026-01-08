# Melhorias de UX: Botão de Edição Visível e Checkout Fake

## Data
2025-01-XX

## Resumo
Duas melhorias implementadas para melhorar a experiência do usuário: botão de edição sempre visível no mobile e página fake do Kiwify para simular checkout quando a URL não estiver configurada.

## Melhorias Implementadas

### 1. Botão de Edição Sempre Visível

#### Problema Identificado
O botão de edição do nome do perfil estava oculto por padrão e só aparecia no hover (`opacity-0 group-hover/name:opacity-100`). Em dispositivos móveis, onde não há hover, os usuários não conseguiam descobrir que era possível editar o nome.

#### Solução
Removida a classe `opacity-0 group-hover/name:opacity-100` do botão de edição, deixando-o sempre visível.

**Antes**:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleStartEditName}
  className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity"
  aria-label="Editar nome"
>
  <Pencil className="h-3 w-3" />
</Button>
```

**Depois**:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleStartEditName}
  className="h-6 w-6"
  aria-label="Editar nome"
>
  <Pencil className="h-3 w-3" />
</Button>
```

#### Benefícios
- **Acessibilidade mobile**: Usuários em dispositivos móveis podem ver e usar o botão de edição
- **Descoberta**: Funcionalidade mais fácil de descobrir
- **Consistência**: Botão sempre visível, sem necessidade de hover

### 2. Página Fake do Kiwify para Simulação

#### Problema Identificado
Quando a URL do Kiwify (`NEXT_PUBLIC_KIWIFY_PRODUCT_URL`) não está configurada, a função `redirectToKiwifyCheckout()` apenas retornava sem fazer nada, impedindo o teste do fluxo completo de cadastro e compra.

#### Solução
Criada uma página fake do Kiwify (`/checkout/fake`) que simula o checkout e permite testar o fluxo completo.

#### Arquivos Criados/Modificados

**1. Nova Página: `src/app/checkout/fake/page.tsx`**
- Página que simula o checkout do Kiwify
- Formulário para email e nome (opcional)
- Exibe informações do plano (gratuito em modo de teste)
- Chama o webhook de teste (`/api/webhooks/kiwify/test`) ao finalizar
- Redireciona para página de sucesso após processamento
- Inclui aviso visual de que é uma simulação

**2. Função Atualizada: `src/lib/utils/checkout.ts`**
- Modificada para redirecionar para `/checkout/fake` quando `NEXT_PUBLIC_KIWIFY_PRODUCT_URL` não estiver configurada
- Mantém comportamento original quando URL está configurada

**Antes**:
```typescript
export function redirectToKiwifyCheckout(email?: string, source?: string) {
  const kiwifyProductUrl = process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_URL;
  
  if (!kiwifyProductUrl) {
    console.error('KIWIFY_PRODUCT_URL not configured');
    return; // ❌ Não fazia nada
  }
  // ...
}
```

**Depois**:
```typescript
export function redirectToKiwifyCheckout(email?: string, source?: string) {
  const kiwifyProductUrl = process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_URL;
  
  if (!kiwifyProductUrl) {
    // ✅ Redireciona para página fake
    const fakeUrl = new URL('/checkout/fake', window.location.origin);
    
    if (email) {
      fakeUrl.searchParams.set('email', email);
    }
    
    if (source) {
      fakeUrl.searchParams.set('source', source);
    }

    if (typeof window !== 'undefined') {
      window.location.href = fakeUrl.toString();
    }
    return;
  }
  // ... comportamento original
}
```

#### Fluxo Completo

1. **Usuário clica em "Fazer Checkout"**
   - Se `NEXT_PUBLIC_KIWIFY_PRODUCT_URL` estiver configurada → Redireciona para Kiwify real
   - Se não estiver configurada → Redireciona para `/checkout/fake`

2. **Na página fake**:
   - Usuário vê formulário de checkout simulado
   - Email pode vir pré-preenchido via query parameter
   - Usuário pode adicionar nome (opcional)
   - Ao clicar em "Finalizar Compra", chama `/api/webhooks/kiwify/test`

3. **Webhook de teste processa**:
   - Cria/atualiza usuário no Supabase Auth
   - Cria/atualiza usuário no banco de dados
   - Cria assinatura com status `active` (30 dias)
   - Envia magic link por email
   - Marca lead como convertido (se existir)

4. **Redirecionamento**:
   - Após sucesso, redireciona para `/checkout/success`
   - Usuário vê mensagem de confirmação

#### Benefícios

- **Desenvolvimento**: Permite testar fluxo completo sem configurar Kiwify
- **Demonstração**: Facilita demonstrações do produto
- **Testes**: Permite testes end-to-end do fluxo de cadastro
- **UX**: Usuário sempre tem um caminho claro, mesmo sem Kiwify configurado

#### Segurança

- A página fake só funciona se o webhook de teste estiver habilitado (`ALLOW_TEST_WEBHOOK=true`)
- Em produção, recomenda-se configurar a URL real do Kiwify
- A página fake inclui aviso visual de que é uma simulação

## Casos de Uso

### Desenvolvimento Local
- Desenvolvedor pode testar fluxo completo sem configurar Kiwify
- Facilita desenvolvimento e debugging

### Demonstrações
- Pode demonstrar o produto sem necessidade de configuração externa
- Fluxo completo funciona de ponta a ponta

### Testes
- Permite testes automatizados do fluxo de checkout
- Facilita testes de integração

## Considerações

### Mobile
- Botão de edição agora sempre visível, melhorando UX em dispositivos móveis
- Página fake responsiva e otimizada para mobile

### Acessibilidade
- Botão sempre visível melhora descoberta de funcionalidades
- Labels e aria-labels mantidos para acessibilidade

### Performance
- Página fake é leve e carrega rapidamente
- Não há dependências externas além do webhook de teste

## Próximos Passos (Opcional)

1. Adicionar mais campos na página fake (se necessário)
2. Melhorar design da página fake para parecer mais com Kiwify real
3. Adicionar validações adicionais no formulário
4. Adicionar loading states mais elaborados

