# Ocultação do MIC Method

## Data
07 de Janeiro de 2025

## Objetivo
Ocultar o MIC Method da aplicação temporariamente usando feature flag, mantendo toda a lógica intacta para fácil reativação no futuro.

## Abordagem
Foi criada uma feature flag `SHOW_MIC_METHOD` em `src/lib/config/features.ts` que controla a visibilidade do MIC Method em toda a aplicação. Quando definida como `false`, o MIC Method fica oculto, mas toda a lógica permanece no código para fácil reativação.

## Alterações Realizadas

### 1. Criação da Feature Flag
**Arquivo:** `src/lib/config/features.ts` (NOVO)

Criado arquivo de configuração para gerenciar feature flags:

```typescript
/**
 * Feature flags para controlar visibilidade de funcionalidades
 * 
 * Para reativar o MIC Method no futuro, altere SHOW_MIC_METHOD para true
 */
export const SHOW_MIC_METHOD = false;
```

### 2. Componente RankingHeader
**Arquivo:** `src/components/ranking/RankingHeader.tsx`

- Adicionada importação da feature flag `SHOW_MIC_METHOD`
- Aba "MIC Method" renderizada condicionalmente baseada na flag
- Grid ajustado dinamicamente: 3 colunas quando ativo, 2 quando oculto

**Implementação:**
```tsx
import { SHOW_MIC_METHOD } from '@/lib/config/features';

<TabsList className={`grid w-full ${SHOW_MIC_METHOD ? 'grid-cols-3' : 'grid-cols-2'}`}>
  <TabsTrigger value="mensal">Mensal</TabsTrigger>
  <TabsTrigger value="anual">Anual</TabsTrigger>
  {SHOW_MIC_METHOD && (
    <TabsTrigger value="bruno-method" className="relative">
      MIC Method
      <span className="ml-1 text-xs">⭐</span>
    </TabsTrigger>
  )}
</TabsList>
```

### 3. Componente EmptyRankingState
**Arquivo:** `src/components/ranking/EmptyRankingState.tsx`

- Botão "Ver MIC Method" renderizado condicionalmente baseado na flag
- Mantida toda a estrutura para fácil reativação

**Implementação:**
```tsx
import { SHOW_MIC_METHOD } from '@/lib/config/features';

{SHOW_MIC_METHOD && (
  <Link href="/bruno-method" className="w-full sm:w-auto">
    <Button variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
      Ver MIC Method
      <ArrowRight className="h-4 w-4 ml-2" />
    </Button>
  </Link>
)}
```

### 4. Componente CheckoutSection
**Arquivo:** `src/components/profile/CheckoutSection.tsx`

- Seção "Ver carteira oficial do Bruno Chimarelli" renderizada condicionalmente
- Mantida toda a estrutura e conteúdo para fácil reativação

**Implementação:**
```tsx
import { SHOW_MIC_METHOD } from '@/lib/config/features';

{SHOW_MIC_METHOD && (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 mt-0.5">
      <Star className="h-5 w-5 text-yellow-500" />
    </div>
    <div>
      <p className="font-semibold">Ver carteira oficial do Bruno Chimarelli</p>
      <p className="text-sm text-muted-foreground">
        Acesse a estratégia completa e atualizada do especialista
      </p>
    </div>
  </div>
)}
```

### 5. Componente PremiumCard
**Arquivo:** `src/components/profile/PremiumCard.tsx`

- Linha "Carteira oficial do Bruno" renderizada condicionalmente
- Mantida toda a estrutura para fácil reativação

**Implementação:**
```tsx
import { SHOW_MIC_METHOD } from '@/lib/config/features';

{SHOW_MIC_METHOD && (
  <div className="flex items-center gap-2 text-sm">
    <Check className="h-4 w-4 text-green-500" />
    <span>Carteira oficial do Bruno</span>
  </div>
)}
```

### 6. Página de Ranking
**Arquivo:** `src/app/(main)/ranking/page.tsx`

- Restaurada a lógica de redirecionamento para `/bruno-method` quando o período é `bruno-method`
- Restaurado o `useEffect` que resetava o período para 'mensal' se estiver em 'bruno-method' e a flag estiver desativada
- Lógica condicional baseada na feature flag

**Implementação:**
```tsx
import { SHOW_MIC_METHOD } from '@/lib/config/features';

// Resetar período para 'mensal' se estiver em 'bruno-method' ao entrar na página de ranking
useEffect(() => {
  if (pathname === '/ranking' && period === 'bruno-method' && !SHOW_MIC_METHOD) {
    setPeriod('mensal');
  }
}, [pathname, period, setPeriod]);

const handlePeriodChange = (newPeriod: RankingPeriod) => {
  if (newPeriod === 'bruno-method' && SHOW_MIC_METHOD) {
    router.push('/bruno-method');
  } else {
    setPeriod(newPeriod);
  }
};
```

### 7. Store de Ranking
**Arquivo:** `src/lib/store/rankingStore.ts`

- Restaurada a lógica condicional que trata `bruno-method` como um caso especial
- Query key ajustada para usar 'mensal' quando período é 'bruno-method'
- Condição `enabled` ajustada para considerar a feature flag
- Lógica de retorno do `brunoPortfolio` restaurada

**Implementação:**
```tsx
import { SHOW_MIC_METHOD } from '@/lib/config/features';

const { data: rankingData, isLoading } = useQuery({
  queryKey: ['ranking', period === 'bruno-method' ? 'mensal' : period],
  queryFn: async () => {
    if (period === 'bruno-method' && SHOW_MIC_METHOD) {
      // Buscar portfolio do Bruno
      const response = await fetch('/api/bruno-portfolio');
      // ...
    }
    // ...
  },
  enabled: period !== 'bruno-method' || SHOW_MIC_METHOD,
  // ...
});

return {
  // ...
  brunoPortfolio: period === 'bruno-method' && SHOW_MIC_METHOD
    ? (brunoData?.portfolio || null)
    : (rankingData?.brunoPortfolio || null),
  // ...
};
```

## Estado Atual

### O que está oculto (SHOW_MIC_METHOD = false)
- Aba "MIC Method" no seletor de períodos do ranking
- Botão "Ver MIC Method" no estado vazio do ranking
- Benefício "Ver carteira oficial do Bruno Chimarelli" nos CTAs de checkout
- Benefício "Carteira oficial do Bruno" no card premium

### O que está mantido
- Toda a lógica de navegação e tratamento do período `bruno-method`
- A página `/bruno-method` continua existindo e funcionando
- A API `/api/bruno-portfolio` continua funcionando
- O tipo `RankingPeriod` ainda inclui `'bruno-method'`
- Todas as queries e lógica de dados permanecem intactas

## Reativação

Para reativar o MIC Method no futuro, você deve:

1. **Alterar a feature flag:**
   ```typescript
   // src/lib/config/features.ts
   export const SHOW_MIC_METHOD = true; // Mudar de false para true
   ```

2. **Pronto!** Toda a funcionalidade será reativada automaticamente:
   - A aba aparecerá no ranking
   - O botão aparecerá no estado vazio
   - Os benefícios aparecerão nos CTAs
   - A navegação funcionará normalmente

## Vantagens desta Abordagem

1. **Reversibilidade fácil:** Apenas uma linha de código para reativar
2. **Código preservado:** Toda a lógica permanece intacta
3. **Sem refatoração futura:** Não será necessário reescrever código
4. **Testável:** Pode ser testado facilmente alternando a flag
5. **Manutenibilidade:** Código claro sobre o que está oculto e por quê

## Testes Recomendados

1. Verificar que apenas as abas "Mensal" e "Anual" aparecem no ranking (quando flag = false)
2. Confirmar que o botão "Ver MIC Method" não aparece no estado vazio do ranking (quando flag = false)
3. Verificar que os CTAs de checkout não mencionam mais o MIC Method (quando flag = false)
4. Confirmar que o card premium não lista mais "Carteira oficial do Bruno" (quando flag = false)
5. Testar a navegação entre períodos mensal e anual
6. **Teste de reativação:** Alterar flag para `true` e verificar que tudo funciona normalmente
