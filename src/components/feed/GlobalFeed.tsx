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

      const response = await fetch(url.toString());
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch feed');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  // Detectar scroll para verificar se está no topo
  useEffect(() => {
    const handleScroll = () => {
      isAtTopRef.current = window.scrollY === 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Verificar estado inicial

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Pull-to-refresh handlers
  useEffect(() => {
    let touchStartY = 0;
    let isDragging = false;
    let currentPullDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTopRef.current || isRefreshing) return;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !isAtTopRef.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;
      
      if (distance > 0) {
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

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
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
  // Só mostra o indicador de pull quando está realmente puxando (não durante refresh)
  const shouldShowPullIndicator = pullDistance > 10 && !isRefreshing;

  return (
    <div ref={containerRef} className="relative">
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

      {/* Indicador de refresh discreto no topo - só aparece quando está atualizando */}
      {isRefreshing && (
        <div className="flex items-center justify-center pt-2 pb-1">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      {/* Botão de refresh fixo */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || isFetching}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isRefreshing || isFetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {posts.map((post: any) => (
          <div key={post.id} data-post-id={post.id}>
            <FeedPost post={post} isOwner={user?.id === post.userId} truncateContent={true} />
          </div>
        ))}
        <div ref={loadMoreRef} className="h-10" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

