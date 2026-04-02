# UI Otimista para Curtidas e Comentários no Feed

## Resumo

Foi implementada UI otimista (optimistic UI) para as ações de curtir/descurtir posts e adicionar comentários no feed. As interfaces atualizam imediatamente quando o usuário realiza essas ações, antes mesmo da requisição ao servidor completar, proporcionando uma experiência mais fluida e responsiva.

## Problema Anterior

Quando o usuário:
1. **Curtia um post**: O contador não atualizava imediatamente, causando atraso perceptível
2. **Adicionava um comentário**: O comentário não aparecia imediatamente e o contador não atualizava até a resposta do servidor

Isso causava uma experiência ruim, parecendo que as ações não funcionaram ou demoraram muito.

## Solução: UI Otimista

A UI otimista atualiza o estado local e os caches do React Query imediatamente, assumindo que a ação será bem-sucedida. Se houver erro, o estado é revertido.

## Implementação

### 1. Curtidas (FeedPost e PostContent)

**Arquivos modificados:**
- `src/components/feed/FeedPost.tsx`
- `src/components/feed/PostContent.tsx`

**Mudanças:**

#### Função Helper para Atualizar Todos os Caches

```typescript
const updatePostInAllQueries = (updater: (post: any) => any) => {
  // Atualizar em user-feed (todas as variações)
  queryClient.setQueriesData(
    { queryKey: ['user-feed'] },
    (old: any) => {
      if (!old || !old.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: any) =>
            p.id === post.id ? updater(p) : p
          ),
        })),
      };
    }
  );

  // Atualizar em global-feed
  queryClient.setQueriesData(
    { queryKey: ['global-feed'] },
    (old: any) => {
      // ... mesma lógica
    }
  );

  // Atualizar em post individual
  queryClient.setQueriesData(
    { queryKey: ['post', post.slug] },
    (old: any) => {
      if (!old || old.id !== post.id) return old;
      return updater(old);
    }
  );
};
```

#### Mutation com UI Otimista

```typescript
const toggleLikeMutation = useMutation({
  mutationFn: async () => {
    const response = await fetch(`/api/feed/${post.id}/like`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to toggle like');
    return response.json();
  },
  // UI Otimista: atualiza imediatamente
  onMutate: async () => {
    // 1. Cancela queries pendentes
    await queryClient.cancelQueries({ queryKey: ['user-feed'] });
    await queryClient.cancelQueries({ queryKey: ['global-feed'] });
    await queryClient.cancelQueries({ queryKey: ['post', post.slug] });

    // 2. Snapshot do estado anterior
    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const newLiked = !previousLiked;
    const newLikeCount = newLiked ? previousLikeCount + 1 : previousLikeCount - 1;

    // 3. Atualizar estado local
    setLiked(newLiked);
    setLikeCount(newLikeCount);

    // 4. Atualizar em todos os caches
    updatePostInAllQueries((p) => ({
      ...p,
      likedByCurrentUser: newLiked,
      likeCount: Math.max(0, newLikeCount),
    }));

    return { previousLiked, previousLikeCount };
  },
  // Em caso de erro, reverter
  onError: (err, variables, context) => {
    if (context) {
      setLiked(context.previousLiked);
      setLikeCount(context.previousLikeCount);
      updatePostInAllQueries((p) => ({
        ...p,
        likedByCurrentUser: context.previousLiked,
        likeCount: context.previousLikeCount,
      }));
    }
  },
  // Após sucesso, sincronizar com servidor
  onSuccess: (data) => {
    setLiked(data.liked);
    setLikeCount(data.likeCount);
    updatePostInAllQueries((p) => ({
      ...p,
      likedByCurrentUser: data.liked,
      likeCount: data.likeCount,
    }));
  },
  // Sincronizar em background após um delay
  onSettled: () => {
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['user-feed'] });
      queryClient.invalidateQueries({ queryKey: ['global-feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.slug] });
    }, 1000);
  },
});
```

### 2. Comentários (PostComments)

**Arquivo modificado:** `src/components/feed/PostComments.tsx`

**Mudanças:**

#### Função Helper para Atualizar Contador de Comentários

```typescript
const updateCommentCountInAllQueries = (increment: number) => {
  // Atualizar em user-feed
  queryClient.setQueriesData(
    { queryKey: ['user-feed'] },
    (old: any) => {
      if (!old || !old.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: any) =>
            p.id === postId
              ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) + increment) }
              : p
          ),
        })),
      };
    }
  );

  // Atualizar em global-feed e post individual (mesma lógica)
};
```

#### Mutation com UI Otimista

```typescript
const addCommentMutation = useMutation({
  mutationFn: async (content: string) => {
    const response = await fetch(`/api/feed/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  },
  // UI Otimista: adiciona comentário imediatamente
  onMutate: async (content: string) => {
    if (!user) return;

    // 1. Cancela queries pendentes
    await queryClient.cancelQueries({ queryKey: ['comments', postId] });
    await queryClient.cancelQueries({ queryKey: ['user-feed'] });
    await queryClient.cancelQueries({ queryKey: ['global-feed'] });
    await queryClient.cancelQueries({ queryKey: ['post'] });

    // 2. Snapshot do estado anterior
    const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]) || [];

    // 3. Criar comentário otimista
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      userId: user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name || 'Você',
        avatarUrl: user.avatarUrl,
      },
    };

    // 4. Atualizar cache de comentários
    queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) => [
      optimisticComment,
      ...old,
    ]);

    // 5. Atualizar contador de comentários em todos os feeds
    updateCommentCountInAllQueries(1);
    
    // 6. Notificar componente pai
    onCommentAdded?.();

    return { previousComments };
  },
  // Em caso de erro, reverter
  onError: (err, variables, context) => {
    if (context) {
      queryClient.setQueryData(['comments', postId], context.previousComments);
      updateCommentCountInAllQueries(-1);
    }
  },
  // Após sucesso, substituir comentário otimista pelo real
  onSuccess: (newComment) => {
    queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) => {
      const filtered = old.filter((c) => !c.id.startsWith('temp-'));
      return [newComment, ...filtered];
    });
  },
  // Sincronizar em background após um delay
  onSettled: () => {
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['user-feed'] });
      queryClient.invalidateQueries({ queryKey: ['global-feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    }, 1000);
  },
});
```

## Fluxo de Execução

### Curtidas

```
┌─────────────────────────────────────────┐
│ Usuário clica em curtir                 │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ onMutate() executa                      │
│ - Cancela queries pendentes             │
│ - Salva snapshot do estado atual        │
│ - Atualiza estado local                 │
│ - Atualiza todos os caches              │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ UI atualiza IMEDIATAMENTE               │
│ Coração fica vermelho                   │
│ Contador aumenta/diminui                │
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
        │   │ - Reverte estado       │
        │   │ - Reverte caches      │
        │   └───────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ onSuccess() executa                     │
│ - Atualiza com dados do servidor        │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ onSettled() executa (após 1s)           │
│ - Sincroniza com servidor               │
└─────────────────────────────────────────┘
```

### Comentários

```
┌─────────────────────────────────────────┐
│ Usuário envia comentário                 │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ onMutate() executa                      │
│ - Cancela queries pendentes             │
│ - Cria comentário otimista             │
│ - Adiciona ao cache de comentários      │
│ - Atualiza contador em todos os feeds   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ UI atualiza IMEDIATAMENTE               │
│ Comentário aparece na lista             │
│ Contador aumenta                        │
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
        │   │ - Remove comentário    │
        │   │ - Reverte contador     │
        │   └───────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ onSuccess() executa                     │
│ - Substitui comentário otimista        │
│   pelo comentário real                  │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ onSettled() executa (após 1s)           │
│ - Sincroniza com servidor               │
└─────────────────────────────────────────┘
```

## Benefícios

1. **Feedback Imediato**: O usuário vê a mudança instantaneamente
2. **Experiência Fluida**: Não há delay perceptível na interface
3. **Consistência**: Todos os feeds são atualizados simultaneamente
4. **Resiliência**: Em caso de erro, o estado é revertido automaticamente
5. **Sincronização**: Após um delay, os dados são sincronizados com o servidor

## Tratamento de Erros

- **Curtidas**: Se a requisição falhar, o estado é revertido para o anterior
- **Comentários**: Se a requisição falhar, o comentário otimista é removido e o contador é revertido
- Erros são logados no console para debug
- A UI não fica em estado inconsistente

## Sincronização com Servidor

- Após sucesso, os dados são atualizados com a resposta do servidor
- Após 1 segundo, as queries são invalidadas e refazem fetch em background
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

### Comentários Otimistas
- Comentários otimistas têm IDs temporários (`temp-${timestamp}`)
- São substituídos pelos comentários reais quando a resposta chega
- Permitem feedback imediato sem esperar o servidor

### Atualização de Múltiplos Caches
- Todas as queries relacionadas são atualizadas simultaneamente
- Garante consistência entre diferentes visualizações do mesmo post
- Inclui: user-feed, global-feed, e post individual

## Componentes Afetados

1. **FeedPost**: Componente de post no feed (user-feed e global-feed)
2. **PostContent**: Componente de post individual
3. **PostComments**: Componente de comentários

## Próximos Passos

- Considerar implementar UI otimista em outras ações (editar post, deletar comentário, etc.)
- Adicionar feedback visual adicional (toast notification) em caso de erro
- Monitorar taxa de erros para identificar problemas de rede
- Considerar debounce para múltiplas ações rápidas





