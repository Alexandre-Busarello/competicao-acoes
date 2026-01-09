# Correção de Erros de Build

## Data
2025-01-XX

## Resumo
Este documento descreve todas as correções realizadas para resolver os erros de build do projeto Next.js.

## Erros Corrigidos

### 1. Erro de Tipo: `user.name` pode ser `undefined`

**Arquivos afetados:**
- `src/components/navigation/UserHeader.tsx`
- `src/components/profile/ProfileInfo.tsx`

**Problema:**
O tipo `AuthUser` define `name` como `string | undefined`, mas as funções `getNameWithoutId()` e `formatUserNameWithId()` esperam uma `string`.

**Solução:**
Adicionado valor padrão (`''` ou `'Usuário'`) quando `user.name` é `undefined`:

```typescript
// Antes
const nameWithoutId = getNameWithoutId(user.name);

// Depois
const nameWithoutId = getNameWithoutId(user.name || '');
```

### 2. Erro: Propriedade `updatePremiumStatus` não existe

**Arquivo afetado:**
- `src/components/profile/CheckoutSection.tsx`

**Problema:**
O componente tentava usar `updatePremiumStatus` do `useUserStore()`, mas essa função não existe no store.

**Solução:**
Removida a chamada inexistente e implementado redirecionamento para checkout da Kiwify usando `redirectToKiwifyCheckout()`:

```typescript
// Antes
const { updatePremiumStatus } = useUserStore();
updatePremiumStatus(true);

// Depois
import { redirectToKiwifyCheckout } from '@/lib/utils/checkout';
redirectToKiwifyCheckout(user?.email, 'profile');
```

**Nota:** O status premium é atualizado automaticamente via webhook da Kiwify após o pagamento ser processado.

### 3. Erro: Propriedade `rank` não existe em `AuthUser`

**Arquivo afetado:**
- `src/components/profile/ProfileInfo.tsx`

**Problema:**
O componente tentava acessar `user.rank`, mas essa propriedade não existe no tipo `AuthUser`.

**Solução:**
Implementada busca do rank através do `useRankingStore()`, seguindo o mesmo padrão usado em `UserRankCard.tsx`:

```typescript
// Antes
Posição no Ranking: #{user.rank}

// Depois
const { competitors } = useRankingStore();
const userInRanking = competitors.find(c => c.id === user.id);
const displayRank = userInRanking?.rank ?? 0;

{displayRank > 0 && (
  <p>Posição no Ranking: #{displayRank}</p>
)}
```

### 4. Erro de Tipo: `'cripto'` não é um valor válido de `AssetType`

**Arquivos afetados:**
- `src/types/index.ts`
- `src/lib/utils/asset-type.ts`

**Problema:**
A função `determineAssetType()` retornava `'cripto'`, mas o tipo `AssetType` não incluía esse valor.

**Solução:**
Adicionado `'cripto'` ao tipo `AssetType`:

```typescript
// Antes
export type AssetType = 'acao' | 'fii' | 'renda-fixa' | 'outros';

// Depois
export type AssetType = 'acao' | 'fii' | 'renda-fixa' | 'cripto' | 'outros';
```

### 5. Erro: `useSearchParams()` precisa estar em Suspense boundary

**Arquivos afetados:**
- `src/app/auth/login/page.tsx`
- `src/app/auth/callback/page.tsx`

**Problema:**
Next.js requer que `useSearchParams()` seja usado dentro de um componente envolvido por `Suspense` para permitir pré-renderização estática.

**Solução:**
Refatorados os componentes para separar a lógica que usa `useSearchParams()` em componentes internos, envolvidos por `Suspense`:

```typescript
// Estrutura aplicada
function LoginForm() {
  // Lógica que usa useSearchParams()
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginForm />
    </Suspense>
  );
}
```

## Resultado Final

Após todas as correções, o build foi concluído com sucesso:

```
✓ Compiled successfully
✓ Linting and checking validity of types ...
✓ Generating static pages (18/18)
```

## Lições Aprendidas

1. **Tipos TypeScript:** Sempre verificar se os valores retornados correspondem aos tipos definidos, especialmente quando propriedades são opcionais (`string | undefined`).

2. **Hooks do Next.js:** Alguns hooks como `useSearchParams()` requerem tratamento especial para funcionar com pré-renderização estática.

3. **Padrões de Código:** Seguir padrões já estabelecidos no código (como buscar rank do `rankingStore`) mantém consistência e evita erros.

4. **Validação de Build:** Executar `npm run build` regularmente ajuda a identificar problemas de tipo e estrutura antes do deploy.

## Arquivos Modificados

1. `src/components/navigation/UserHeader.tsx`
2. `src/components/profile/CheckoutSection.tsx`
3. `src/components/profile/ProfileInfo.tsx`
4. `src/types/index.ts`
5. `src/app/auth/login/page.tsx`
6. `src/app/auth/callback/page.tsx`

## Próximos Passos Recomendados

1. Adicionar testes unitários para validar os casos onde `user.name` é `undefined`
2. Considerar criar um tipo mais específico para o usuário autenticado que sempre tenha `name` definido
3. Documentar o fluxo de atualização de status premium via webhook
4. Adicionar tratamento de erro mais robusto para casos onde o ranking não está disponível




