# Correção do Loading na Página de Detalhes da Carteira

## Data: 09/01/2026

## Problema Identificado

Ao dar refresh na página de detalhes da carteira (`/carteira/[id]`), a mensagem "Competidor não encontrado" aparecia imediatamente enquanto os dados ainda estavam sendo carregados do backend. Isso causava uma experiência ruim para o usuário, que via uma mensagem de erro antes mesmo dos dados serem buscados.

### Comportamento Anterior

```typescript
const { competitors } = useRankingStore();
const competitor = competitors.find((c) => c.id === id);

if (!competitor) {
  // Mostrava "não encontrado" mesmo durante o loading
  return <div>Competidor não encontrado</div>;
}
```

**Problema**: O `competitors` array estava vazio durante o carregamento inicial, então a condição `!competitor` era verdadeira mesmo quando os dados ainda estavam sendo buscados.

## Solução Implementada

Foi adicionada a verificação do estado `isLoading` do `useRankingStore()` antes de verificar se o competidor existe. Agora a página:

1. **Mostra loading** enquanto os dados estão sendo carregados
2. **Só mostra "não encontrado"** quando o loading terminar e o competidor realmente não existir

### Implementação Técnica

```typescript
const { competitors, isLoading } = useRankingStore();

// Mostrar loading enquanto os dados estão sendo carregados
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg animate-pulse">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <p className="text-muted-foreground">Carregando carteira...</p>
      </div>
    </div>
  );
}

// Só mostrar "não encontrado" quando não estiver carregando e realmente não encontrar
if (!competitor) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Competidor não encontrado</h1>
        <Link href="/ranking">
          <Button variant="outline">Voltar ao Ranking</Button>
        </Link>
      </div>
    </div>
  );
}
```

### Estilo do Loading

O loading utiliza o mesmo padrão visual da página de ranking para manter consistência:

- **Ícone**: Wallet (carteira) com animação de pulse
- **Cores**: Gradiente amarelo-laranja (`from-yellow-400 to-orange-500`)
- **Layout**: Centralizado na tela com mensagem "Carregando carteira..."
- **Animação**: `animate-pulse` para feedback visual

## Benefícios

1. **Melhor UX**: Usuário vê um loading ao invés de uma mensagem de erro durante o carregamento
2. **Feedback Visual**: Animação de pulse indica claramente que algo está sendo carregado
3. **Consistência**: Mesmo padrão visual usado na página de ranking
4. **Precisão**: Mensagem "não encontrado" só aparece quando realmente não há competidor

## Fluxo de Estados

1. **Estado Inicial**: `isLoading = true` → Mostra loading
2. **Dados Carregados**: `isLoading = false` → Verifica se competidor existe
3. **Competidor Encontrado**: Mostra página com detalhes da carteira
4. **Competidor Não Encontrado**: Mostra mensagem "Competidor não encontrado"

## Arquivos Modificados

- `src/app/carteira/[id]/page.tsx`
  - Adicionado `isLoading` do `useRankingStore()`
  - Adicionada verificação de loading antes de verificar competidor
  - Adicionado componente de loading com ícone Wallet
  - Adicionado import do ícone `Wallet` do lucide-react

## Observações

- O `isLoading` vem do React Query usado no `useRankingStore()`
- O loading é exibido durante o fetch inicial dos dados do ranking
- Após o carregamento, se o competidor não existir no ranking, a mensagem de erro é exibida corretamente
- O mesmo padrão pode ser aplicado em outras páginas que dependem de dados do ranking







