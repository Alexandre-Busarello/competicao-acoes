'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { FeedPost } from './FeedPost';
import { Loader2, RefreshCw } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { Button } from '@/components/ui/button';

export function GlobalFeed() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const viewedPostIdsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const seenPostIdsRef = useRef<Set<string>>(new Set());
  const loopPageRef = useRef<number>(0);
  
  // Seed consistente por sessão - gerado uma vez e reutilizado
  const sessionSeedRef = useRef<string | null>(null);
  
  // Gerar ou recuperar seed da sessão
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = 'feed-session-seed';
      let seed = sessionStorage.getItem(storageKey);
      
      if (!seed) {
        // Gerar novo seed para esta sessão
        seed = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem(storageKey, seed);
      }
      
      sessionSeedRef.current = seed;
    }
  }, []);
  
  // Estado para pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const isAtTopRef = useRef<boolean>(true);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['global-feed'],
    queryFn: async ({ pageParam }) => {
      const url = new URL('/api/feed/global', window.location.origin);
      url.searchParams.set('limit', '20');
      if (pageParam) {
        url.searchParams.set('cursor', pageParam);
      }
      // Usar seed da sessão para consistência e cache eficiente
      const seed = sessionSeedRef.current || Date.now().toString();
      url.searchParams.set('seed', seed);

      const response = await fetch(url.toString());
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch feed');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      // Se não há mais posts, retornar 'loop' para entrar em loop
      if (!lastPage.nextCursor && lastPage.posts && lastPage.posts.length > 0) {
        return 'loop';
      }
      return lastPage.nextCursor || undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!user, // Só busca se usuário estiver logado
  });

  // Registrar visualizações quando posts entram na viewport
  useEffect(() => {
    if (!user || !data) return;

    const posts = data.pages.flatMap((page) => page.posts);
    if (posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId && !viewedPostIdsRef.current.has(postId)) {
              viewedPostIdsRef.current.add(postId);
              
              // Registrar visualização na API
              fetch(`/api/feed/${postId}/view`, {
                method: 'POST',
              }).catch((error) => {
                console.error('Error registering view:', error);
              });
            }
          }
        });
      },
      { threshold: 0.5 } // Considera visualizado quando 50% está visível
    );

    // Observar todos os posts
    posts.forEach((post: any) => {
      const element = document.querySelector(`[data-post-id="${post.id}"]`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [data, user]);

  // Detectar scroll no final para carregar mais posts (scroll infinito)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          if (hasNextPage) {
            fetchNextPage();
          } else {
            // Loop infinito: quando não há mais posts, buscar novamente
            // Usar mesmo seed da sessão para manter consistência
            loopPageRef.current += 1;
            const url = new URL('/api/feed/global', window.location.origin);
            url.searchParams.set('limit', '20');
            const seed = sessionSeedRef.current || Date.now().toString();
            url.searchParams.set('seed', seed);
            url.searchParams.set('loop', 'true');
            
            // Buscar posts que ainda não foram vistos
            const allSeenIds = Array.from(seenPostIdsRef.current);
            if (allSeenIds.length > 0) {
              url.searchParams.set('excludeIds', allSeenIds.join(','));
            }

            fetch(url.toString())
              .then(res => res.json())
              .then(result => {
                // Adicionar novos posts ao cache do React Query
                queryClient.setQueryData(['global-feed'], (old: any) => {
                  if (!old) return old;
                  const newPages = [...old.pages];
                  newPages.push({
                    ...result,
                    nextCursor: 'loop', // Continuar em loop
                  });
                  return {
                    ...old,
                    pages: newPages,
                  };
                });
              })
              .catch(err => console.error('Error fetching loop posts:', err));
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, queryClient]);

  // Função para atualizar o feed
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidar e refazer fetch da primeira página
      await queryClient.invalidateQueries({ queryKey: ['global-feed'] });
      await refetch();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [queryClient, refetch]);

  // Registrar posts vistos para loop
  useEffect(() => {
    const posts = data?.pages.flatMap((page) => page.posts) || [];
    posts.forEach((post: any) => {
      seenPostIdsRef.current.add(post.id);
    });
  }, [data]);

  // Detectar scroll para pull-to-refresh
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      isAtTopRef.current = container.scrollTop <= 10;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Pull-to-refresh handlers - adaptado para container interno
  useEffect(() => {
    let touchStartY = 0;
    let isDragging = false;
    let currentPullDistance = 0;
    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (!container || !isAtTopRef.current || isRefreshing) return;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      // Verificar se o toque está dentro do container
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        touchStartY = touch.clientY;
        isDragging = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !isAtTopRef.current || isRefreshing || !container) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;
      
      if (distance > 0 && container.scrollTop === 0) {
        const maxPull = 100;
        const pull = Math.min(distance, maxPull);
        currentPullDistance = pull;
        setPullDistance(pull);
        setIsPulling(true);
        
        // Prevenir scroll padrão quando puxando
        if (pull > 10) {
          e.preventDefault();
        }
      } else {
        currentPullDistance = 0;
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleTouchEnd = () => {
      if (currentPullDistance > 50 && isAtTopRef.current && !isRefreshing) {
        // Reset pull distance imediatamente ao soltar
        setPullDistance(0);
        setIsPulling(false);
        // Iniciar refresh
        handleRefresh();
      } else {
        // Reset suave se não atingiu o threshold
        setPullDistance(0);
        setIsPulling(false);
      }
      isDragging = false;
      currentPullDistance = 0;
    };

    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isRefreshing, handleRefresh]);

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Mostrar loading enquanto está carregando
  if (isLoading || (isFetching && !data)) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Verificar se usuário não está logado
  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Você precisa estar logado para ver o feed global.</p>
      </div>
    );
  }

  // Só mostrar mensagem vazia se não estiver carregando e realmente não houver posts
  if (posts.length === 0 && !isFetching) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum post ainda.</p>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-4"
          variant="outline"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </>
          )}
        </Button>
      </div>
    );
  }

  const pullProgress = Math.min(pullDistance / 100, 1);
  const shouldShowPullIndicator = pullDistance > 10 && !isRefreshing;

  return (
    <div 
      ref={containerRef} 
      className="relative h-full overflow-y-auto scrollbar-hide md:scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Pull-to-refresh indicator - só mostra durante o pull, desaparece ao soltar */}
      {shouldShowPullIndicator && (
        <div
          className="flex items-center justify-center transition-all duration-200 absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            opacity: pullProgress,
            transform: `translateY(${Math.max(-20, pullDistance - 20)}px)`,
            height: `${Math.max(0, pullDistance)}px`,
          }}
        >
          {pullDistance > 50 ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Solte para atualizar
              </span>
            </>
          ) : (
            <RefreshCw
              className="h-5 w-5 text-muted-foreground"
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
                transition: 'transform 0.2s',
              }}
            />
          )}
        </div>
      )}

      {/* Container de posts - ordem correta do backend (mais antigos no topo, mais recentes embaixo) */}
      <div className="space-y-4 pb-4">
        {posts.map((post: any) => (
          <div key={post.id} data-post-id={post.id}>
            <FeedPost post={post} isOwner={user?.id === post.userId} truncateContent={true} />
          </div>
        ))}
      </div>

      {/* Trigger para carregar mais posts quando scrolla para o final */}
      <div ref={loadMoreRef} className="h-10" />
      
      {/* Loading quando carregando mais posts */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

