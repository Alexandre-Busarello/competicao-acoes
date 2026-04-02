# Prioridade da Seção de Checkout no Perfil para CTAs de Conversão

## Data: 09/01/2026

## Resumo
Implementação de lógica para mostrar a seção "Upgrade para Premium" primeiro na página de perfil quando o usuário é redirecionado através de um CTA de conversão.

## Problema Identificado

Quando usuários clicavam em CTAs de conversão (como "Fazer Upgrade para Premium" em overlays de carteiras bloqueadas), eram redirecionados para `/perfil`, mas a seção de checkout aparecia por último, após `ProfileInfo` e `PasswordManager`. Isso reduzia a visibilidade do CTA e poderia diminuir a taxa de conversão.

## Solução Implementada

### 1. Query Parameter para Detectar Origem

**Você deve** adicionar o query parameter `?from=cta` em todos os links que redirecionam para `/perfil` através de CTAs de conversão.

**Você NÃO deve** adicionar esse parâmetro em links de navegação normal (como menu de usuário).

**Implementação**:

Links de CTAs de conversão agora incluem `?from=cta`:
- `BlurOverlay` (quando usuário tenta ver carteira bloqueada)
- `Bruno Method page` (quando usuário tenta ver carteira do Bruno)

### 2. Detecção na Página de Perfil

**Você deve** verificar o query parameter `from=cta` na página de perfil.

**Você deve** mostrar `CheckoutSection` primeiro quando detectar que veio de CTA de conversão e o usuário não é premium.

**Você NÃO deve** alterar a ordem quando o usuário já é premium (mostra `PremiumCard` normalmente).

**Implementação**:

```typescript
const searchParams = useSearchParams();
const fromCTA = searchParams.get('from') === 'cta';

// Se veio de CTA de conversão, mostrar CheckoutSection primeiro
if (fromCTA && !isPremium) {
  return (
    <>
      <CheckoutSection />
      <ProfileInfo />
      <PasswordManager />
    </>
  );
}
```

### 3. Suspense para useSearchParams

**Você deve** usar `Suspense` ao redor do componente que usa `useSearchParams()` no Next.js 13+.

**Você deve** fornecer um fallback adequado durante o carregamento.

**Implementação**:

```typescript
export default function ProfilePage() {
  return (
    <Suspense fallback={...}>
      <ProfileContent />
    </Suspense>
  );
}
```

## Fluxo Atualizado

### Usuário Clica em CTA de Conversão

1. Usuário vê overlay/bloqueio em carteira de outro competidor
2. Clica em "Fazer Upgrade para Premium"
3. É redirecionado para `/perfil?from=cta`
4. Página detecta `from=cta` via query parameter
5. **CheckoutSection aparece primeiro** (antes de ProfileInfo e PasswordManager)
6. Usuário vê imediatamente os benefícios e preço do premium

### Usuário Acessa Perfil Normalmente

1. Usuário acessa `/perfil` (sem query params)
2. Ordem normal: ProfileInfo → PasswordManager → CheckoutSection/PremiumCard
3. Comportamento padrão mantido

## Arquivos Modificados

### 1. `src/app/(main)/perfil/page.tsx`
- Adicionado import de `Suspense` e `useSearchParams`
- Criado componente `ProfileContent` para usar dentro de Suspense
- Adicionada lógica para detectar `from=cta` e reordenar componentes
- Adicionado fallback de loading no Suspense

### 2. `src/components/portfolio/BlurOverlay.tsx`
- Atualizado link para `/perfil?from=cta` em ambos os botões

### 3. `src/app/bruno-method/page.tsx`
- Atualizado link para `/perfil?from=cta` em ambos os botões

## Benefícios

1. **Maior visibilidade**: Seção de checkout aparece primeiro quando usuário vem de CTA
2. **Melhor conversão**: Usuário vê imediatamente os benefícios e preço
3. **Experiência focada**: Reduz distrações quando o objetivo é conversão
4. **Não invasivo**: Não altera comportamento quando acesso é normal

## Casos de Uso

### CTAs que Redirecionam para Perfil

1. **BlurOverlay**: Quando usuário tenta ver carteira bloqueada de outro competidor
2. **Bruno Method**: Quando usuário tenta ver carteira oficial do Bruno Chimarelli
3. **Outros CTAs futuros**: Qualquer CTA que redirecione para `/perfil` deve incluir `?from=cta`

### Links que NÃO Devem Incluir Query Param

1. **Menu de navegação**: Links normais de navegação (ex: UserHeader)
2. **Breadcrumbs**: Navegação estrutural
3. **Botões de voltar**: Navegação de retorno

## Observações Técnicas

- O query parameter `from=cta` é opcional e não quebra a funcionalidade se não estiver presente
- A lógica só reordena quando `from=cta` está presente E usuário não é premium
- Se usuário já é premium, mostra `PremiumCard` normalmente, independente do query param
- O uso de `Suspense` é necessário porque `useSearchParams()` requer isso no Next.js 13+ App Router

