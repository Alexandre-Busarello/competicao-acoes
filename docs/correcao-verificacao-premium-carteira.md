# Correção da Verificação de Status Premium nas Páginas de Carteira

## Data: 09/01/2026

## Problema Identificado

As páginas de carteira com URLs específicas de período (`/carteira/[id]/mensal/[year]/[month]` e `/carteira/[id]/anual/[year]`) estavam exibindo blur e CTA como se o usuário não fosse assinante, mesmo quando o usuário estava logado e era premium.

## Causa Raiz

As páginas estavam usando `useQuery` diretamente para buscar dados do usuário, mas não estavam extraindo corretamente o objeto `user` da resposta da API:

```typescript
// ❌ Código incorreto
const { data: user } = useQuery({
  queryKey: ['auth', 'user'],
  queryFn: async () => {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    return response.json(); // Retorna { user: ... }, não o usuário diretamente
  },
});

const isPremium = user?.isPremium ?? false; // user é { user: ... }, então isPremium sempre undefined
```

O endpoint `/api/auth/me` retorna `{ user: session.user }`, então `data` seria `{ user: ... }` e não o usuário diretamente. Isso fazia com que `user?.isPremium` sempre fosse `undefined`, resultando em `isPremium = false`.

## Solução Implementada

As páginas foram atualizadas para usar `useUserStore()`, que é o padrão usado em outras páginas do sistema e já faz o tratamento correto da resposta da API:

```typescript
// ✅ Código correto
import { useUserStore } from '@/lib/store/userStore';

const { user } = useUserStore();
const isPremium = user?.isPremium ?? false;
const isOwner = user?.id === id;
```

O `useUserStore()` internamente usa `useAuth()`, que já extrai corretamente `data.user` da resposta da API:

```typescript
// Em useAuth() (src/lib/auth/client.ts)
const { data: user } = useQuery({
  queryKey: ['auth', 'user', session?.user?.id],
  queryFn: async () => {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    return data.user as AuthUser | null; // ✅ Extrai data.user corretamente
  },
});
```

## Arquivos Modificados

### 1. `src/app/carteira/[id]/mensal/[year]/[month]/page.tsx`

**Mudanças:**
- Removido import de `useQuery` do `@tanstack/react-query`
- Adicionado import de `useUserStore` de `@/lib/store/userStore`
- Substituído `useQuery` manual por `useUserStore()`

**Antes:**
```typescript
import { useQuery } from '@tanstack/react-query';

const { data: user } = useQuery({
  queryKey: ['auth', 'user'],
  queryFn: async () => {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    return response.json();
  },
});
```

**Depois:**
```typescript
import { useUserStore } from '@/lib/store/userStore';

const { user } = useUserStore();
```

### 2. `src/app/carteira/[id]/anual/[year]/page.tsx`

**Mudanças:**
- Mesmas alterações da página mensal

## Comportamento Após Correção

- **Usuários Premium**: Veem a carteira completa sem blur e sem CTA de upgrade
- **Usuários Não Premium**: Veem blur e CTA de upgrade corretamente
- **Usuários Deslogados**: Veem blur e CTA de upgrade corretamente
- **Dono da Carteira**: Vê botão de edição independente do status premium

## Benefícios

1. **Consistência**: Todas as páginas agora usam o mesmo padrão (`useUserStore()`) para verificar status do usuário
2. **Manutenibilidade**: Código mais simples e fácil de manter
3. **Reutilização**: Aproveita a lógica já testada e validada em outras páginas
4. **Cache**: `useUserStore()` usa React Query internamente, então os dados do usuário são cacheados e compartilhados entre componentes

## Testes Recomendados

1. ✅ Acessar `/carteira/[id]/mensal/2026/01` como usuário premium - deve ver sem blur
2. ✅ Acessar `/carteira/[id]/anual/2026` como usuário premium - deve ver sem blur
3. ✅ Acessar como usuário não premium - deve ver blur e CTA
4. ✅ Acessar como usuário deslogado - deve ver blur e CTA
5. ✅ Acessar própria carteira - deve ver botão de edição

## Observações

- O problema não afetava outras páginas porque elas já usavam `useUserStore()` ou `useAuth()` corretamente
- A correção mantém a mesma funcionalidade, apenas corrige a forma como os dados do usuário são obtidos
- O cache do React Query garante que múltiplas chamadas à API não sejam feitas desnecessariamente


