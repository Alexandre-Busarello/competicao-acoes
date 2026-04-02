# UI Otimista para Seguir/Deixar de Seguir no Perfil Público

## Resumo

Foi implementada UI otimista (optimistic UI) para a ação de seguir/deixar de seguir no perfil público. A interface atualiza imediatamente quando o usuário clica no botão, antes mesmo da requisição ao servidor completar, proporcionando uma experiência mais fluida e responsiva.

## Problema Anterior

Quando o usuário clicava em "Seguir":
1. A requisição era enviada ao servidor
2. O botão mudava para "Seguindo" temporariamente
3. A requisição de atualização do perfil era invalidada
4. Como a requisição demorava, o botão voltava para "Seguir" antes da resposta chegar
5. Isso causava uma experiência ruim, parecendo que a ação não funcionou

## Solução: UI Otimista

A UI otimista atualiza o estado local imediatamente, assumindo que a ação será bem-sucedida. Se houver erro, o estado é revertido.

### Implementação

**Arquivo:** `src/components/profile/PublicProfileHeader.tsx`

**Mudanças na Mutation:**

```typescript
const followMutation = useMutation({
  mutationFn: async () => {
    // Requisição ao servidor
    const response = await fetch(`/api/users/${userId}/follow`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to follow');
    return response.json();
  },
  // UI Otimista: atualiza o cache antes da requisição completar
  onMutate: async () => {
    // 1. Cancela queries em andamento
    await queryClient.cancelQueries({ queryKey: ['public-profile', userId] });

    // 2. Salva snapshot do estado anterior (para rollback)
    const previousProfile = queryClient.getQueryData(['public-profile', userId]);

    // 3. Atualiza o cache otimisticamente
    queryClient.setQueryData(['public-profile', userId], (old: any) => {
      if (!old) return old;
      const newIsFollowing = !old.isFollowing;
      return {
        ...old,
        isFollowing: newIsFollowing,
        stats: {
          ...old.stats,
          followerCount: newIsFollowing
            ? Math.max(0, old.stats.followerCount + 1)
            : Math.max(0, old.stats.followerCount - 1),
        },
      };
    });

    // 4. Retorna contexto para rollback em caso de erro
    return { previousProfile };
  },
  // Em caso de erro, reverte para o estado anterior
  onError: (err, variables, context) => {
    console.error('Error following user:', err);
    if (context?.previousProfile) {
      queryClient.setQueryData(['public-profile', userId], context.previousProfile);
    }
  },
  // Após sucesso, marca como stale para sincronizar depois
  onSuccess: () => {
    queryClient.invalidateQueries({ 
      queryKey: ['public-profile', userId],
      refetchType: 'none', // Não refaz fetch imediatamente
    });
  },
  // Sincroniza com servidor após um delay
  onSettled: () => {
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['public-profile', userId],
      });
    }, 1000);
  },
});
```

## Fluxo de Execução

### 1. Usuário Clica em "Seguir"

```
┌─────────────────────────────────────────┐
│ Usuário clica no botão                  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ onMutate() executa                      │
│ - Cancela queries pendentes             │
│ - Salva snapshot do estado atual        │
│ - Atualiza cache otimisticamente        │
│   • isFollowing: false → true          │
│   • followerCount: X → X + 1           │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ UI atualiza IMEDIATAMENTE               │
│ Botão mostra "Seguindo"                 │
│ Contador de seguidores aumenta          │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ mutationFn() executa                    │
│ Requisição ao servidor                  │
└─────────────────────────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
   Sucesso      Erro
        │           │
        │           ▼
        │   ┌───────────────────────┐
        │   │ onError() executa      │
        │   │ - Reverte para estado │
        │   │   anterior            │
        │   └───────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ onSuccess() executa                     │
│ - Marca query como stale                │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ onSettled() executa (após 1s)           │
│ - Sincroniza com servidor               │
│ - Garante dados atualizados             │
└─────────────────────────────────────────┘
```

## Benefícios

1. **Feedback Imediato**: O usuário vê a mudança instantaneamente
2. **Experiência Fluida**: Não há delay perceptível na interface
3. **Resiliência**: Em caso de erro, o estado é revertido automaticamente
4. **Sincronização**: Após um delay, os dados são sincronizados com o servidor

## Tratamento de Erros

- Se a requisição falhar, o estado é revertido para o anterior
- O usuário vê o botão voltar ao estado original
- Um erro é logado no console para debug
- A UI não fica em estado inconsistente

## Sincronização com Servidor

- Após sucesso, a query é marcada como `stale` mas não refaz fetch imediatamente
- Após 1 segundo, a query é invalidada e refaz fetch em background
- Isso garante que os dados estejam sincronizados sem bloquear a UI
- O usuário não percebe o refetch porque a UI já está atualizada

## Considerações Técnicas

### Cancelamento de Queries
- Queries pendentes são canceladas para evitar sobrescrever a atualização otimista
- Isso garante que a UI otimista não seja sobrescrita por dados antigos

### Snapshot do Estado
- O estado anterior é salvo antes da atualização otimista
- Permite rollback em caso de erro
- Garante que não perdemos dados importantes

### Atualização do Contador
- O contador de seguidores é atualizado otimisticamente
- Usa `Math.max(0, ...)` para evitar valores negativos
- Sincroniza com o servidor após a mutation completar

## Próximos Passos

- Considerar implementar UI otimista em outras ações (like, comment, etc.)
- Adicionar feedback visual adicional (toast notification) em caso de erro
- Monitorar taxa de erros para identificar problemas de rede

