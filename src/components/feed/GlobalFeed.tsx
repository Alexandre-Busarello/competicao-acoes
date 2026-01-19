'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { FeedPost } from './FeedPost';
import { FeedBanner } from './FeedBanner';
import { Loader2, RefreshCw } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { Button } from '@/components/ui/button';
import { ScrollToTopButton } from './ScrollToTopButton';
import { getCurrentSeed, onFeedSeedUpdate } from '@/lib/utils/feed-seed';
import { useFeedBanner } from '@/lib/hooks/useFeedBanner';
import Image from 'next/image';

interface GlobalFeedProps {
  filterInteractions?: boolean;
  filterMyPosts?: boolean;
  filterComponent?: React.ReactNode;
}

export function GlobalFeed({ filterInteractions = false, filterMyPosts = false, filterComponent }: GlobalFeedProps) {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const viewedPostIdsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const seenPostIdsRef = useRef<Set<string>>(new Set());
  const loopPageRef = useRef<number>(0);
  const { getBannerForPosition } = useFeedBanner();
  
  // Seed consistente por sessão - gerado uma vez e reutilizado
  // O seed só muda quando o usuário cria um post (não quando interage)
  const sessionSeedRef = useRef<string | null>(null);
  
  // Gerar ou recuperar seed da sessão
  useEffect(() => {
    sessionSeedRef.current = getCurrentSeed();
  }, []);

  // Resetar scroll ao montar componente para evitar scroll cortado ao navegar de outra página
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []); // Apenas ao montar
  
  // Escutar mudanças no seed apenas quando usuário cria posts
  // Não invalidamos o cache para manter o feed atual carregado
  useEffect(() => {
    const unsubscribe = onFeedSeedUpdate((newSeed) => {
      sessionSeedRef.current = newSeed;
      // Apenas atualiza o seed para próximas requisições, sem invalidar cache atual
      // O feed atual continua mostrando os posts já carregados
    });
    
    return unsubscribe;
  }, []);
  
  // Estado para pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const isAtTopRef = useRef<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['global-feed', filterInteractions, filterMyPosts],
    queryFn: async ({ pageParam }) => {
      const url = new URL('/api/feed/global', window.location.origin);
      url.searchParams.set('limit', '20');
      if (pageParam) {
        url.searchParams.set('cursor', pageParam);
      }
      // Usar seed da sessão para consistência e cache eficiente (só para feed global)
      if (!filterInteractions && !filterMyPosts) {
        const seed = sessionSeedRef.current || Date.now().toString();
        url.searchParams.set('seed', seed);
      }
      // Adicionar filtro de interações se ativo
      if (filterInteractions) {
        url.searchParams.set('filterInteractions', 'true');
      }
      // Adicionar filtro de meus posts se ativo
      if (filterMyPosts) {
        url.searchParams.set('filterMyPosts', 'true');
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
    getNextPageParam: (lastPage) => {
      // Para interações ou meus posts, não usar loop - retornar null quando não houver mais posts
      if (filterInteractions || filterMyPosts) {
        return lastPage.nextCursor || undefined;
      }
      // Se não há mais posts, retornar 'loop' para entrar em loop (apenas feed global)
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

  // Sincronizar isLoadingMore com isFetchingNextPage do React Query
  useEffect(() => {
    if (isFetchingNextPage) {
      // Quando React Query começa a buscar, garantir que loading está ativo
      setIsLoadingMore(true);
    } else if (!isFetchingNextPage && isLoadingMore) {
      // Quando React Query termina, limpar o loading local após um pequeno delay
      // para garantir que o estado foi atualizado completamente
      const timer = setTimeout(() => {
        setIsLoadingMore(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFetchingNextPage, isLoadingMore]);


  // Detectar scroll no final para carregar mais posts (scroll infinito)
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    const scrollContainer = containerRef.current;
    
    if (!loadMoreElement || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isFetchingNextPage && !isLoadingMore) {
          if (hasNextPage) {
            // Setar loading imediatamente antes de chamar fetchNextPage
            setIsLoadingMore(true);
            fetchNextPage();
          } else if (!filterInteractions && !filterMyPosts) {
            // Loop infinito: quando não há mais posts, buscar novamente (apenas feed global)
            // Usar mesmo seed da sessão para manter consistência
            setIsLoadingMore(true);
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
                queryClient.setQueryData(['global-feed', false, false], (old: any) => {
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
              .catch(err => console.error('Error fetching loop posts:', err))
              .finally(() => {
                setIsLoadingMore(false);
              });
          }
        }
      },
      { 
        threshold: 0.1,
        root: scrollContainer, // Usar o container de scroll como root (importante para desktop)
        rootMargin: '200px' // Trigger antes de chegar completamente no final (funciona melhor no desktop)
      }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, isLoadingMore, fetchNextPage, queryClient, filterInteractions, filterMyPosts, data]);

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

  // Detectar scroll para pull-to-refresh e atualizar estado
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      isAtTopRef.current = scrollTop <= 1;
      
      // Se não está no topo e está puxando, resetar
      if (!isAtTopRef.current && isPulling) {
        setPullDistance(0);
        setIsPulling(false);
      }
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
  }, [isPulling]);

  // Pull-to-refresh - implementação simplificada e funcional
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let currentY = 0;
    let isPullingDown = false;
    let pullDistance = 0;

    const isInteractiveElement = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      return !!el.closest('button, a, [role="button"], input, textarea, select, [data-no-pull]');
    };

    const handleStart = (clientY: number, target: HTMLElement | null) => {
      // Só iniciar se estiver no topo, não estiver refresando e não for elemento interativo
      const scrollTop = container.scrollTop;
      const isInteractive = isInteractiveElement(target);
      const canStart = scrollTop <= 1 && !isRefreshing && !isInteractive;
      if (!canStart) {
        return false;
      }
      
      startY = clientY;
      isPullingDown = true;
      return true;
    };

    const handleMove = (clientY: number, target: HTMLElement | null) => {
      if (!isPullingDown || isRefreshing) return false;
      
      // Se moveu para elemento interativo, cancelar
      const isInteractive = isInteractiveElement(target);
      if (isInteractive) {
        isPullingDown = false;
        setPullDistance(0);
        setIsPulling(false);
        return false;
      }

      // Verificar se ainda está no topo
      const scrollTop = container.scrollTop;
      if (scrollTop > 1) {
        isPullingDown = false;
        setPullDistance(0);
        setIsPulling(false);
        return false;
      }

      currentY = clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0) {
        // Puxando para baixo
        const maxPull = 100;
        pullDistance = Math.min(deltaY * 0.7, maxPull);
        setPullDistance(pullDistance);
        setIsPulling(true);
        return pullDistance > 10; // Prevenir scroll se puxando significativamente
      } else {
        // Puxando para cima ou movimento mínimo
        setPullDistance(0);
        setIsPulling(false);
        return false;
      }
    };

    const handleEnd = () => {
      if (!isPullingDown) return;
      
      // Usar o valor atual de pullDistance antes de resetar
      const currentPull = pullDistance;
      const scrollTop = container.scrollTop;
      const shouldRefresh = currentPull > 50 && scrollTop <= 1;
      
      setPullDistance(0);
      setIsPulling(false);
      isPullingDown = false;
      pullDistance = 0;
      
      if (shouldRefresh) {
        handleRefresh();
      }
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      handleStart(touch.clientY, target);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      const shouldPrevent = handleMove(touch.clientY, target);
      if (shouldPrevent && pullDistance > 10) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    const onTouchCancel = () => {
      setPullDistance(0);
      setIsPulling(false);
      isPullingDown = false;
    };

    // Mouse events para desktop (opcional, para testar)
    const onMouseDown = (e: MouseEvent) => {
      if (handleStart(e.clientY, e.target as HTMLElement)) {
        // Não fazer nada especial
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isPullingDown) {
        const shouldPrevent = handleMove(e.clientY, e.target as HTMLElement);
        if (shouldPrevent && pullDistance > 10) {
          e.preventDefault();
        }
      }
    };

    const onMouseUp = () => {
      if (isPullingDown) {
        handleEnd();
      }
    };

    // Adicionar listeners - touchstart pode ser passivo, touchmove precisa ser não-passivo
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchCancel, { passive: true });
    
    // Mouse events (opcional para desktop)
    container.addEventListener('mousedown', onMouseDown, { passive: true });
    container.addEventListener('mousemove', onMouseMove, { passive: false });
    container.addEventListener('mouseup', onMouseUp, { passive: true });
    container.addEventListener('mouseleave', onMouseUp, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchCancel);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
    };
  }, [isRefreshing, handleRefresh, data]); // Adicionar 'data' como dependência para re-executar quando o container for renderizado

  // Verificar se usuário não está logado
  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Você precisa estar logado para ver o feed global.</p>
      </div>
    );
  }

  const pullProgress = Math.min(pullDistance / 100, 1);
  const shouldShowPullIndicator = (pullDistance > 5 || isRefreshing) && (isAtTopRef.current || isRefreshing);

  // Loading inicial com logo animado - PRIMEIRO, antes de outras verificações
  // Verificar tanto isLoading quanto isFetching para cobrir todos os casos
  if ((isLoading || (isFetching && !data)) && !data) {
    return (
      <div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          {/* Logo animado */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              {/* Logo SVG - usando a logo combinada */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Image 
                  src="/logo-combinada-claro.svg" 
                  alt="Hold Arena" 
                  width={128}
                  height={128}
                  className="w-full h-full object-contain dark:hidden animate-pulse"
                />
                <Image 
                  src="/logo-combinada-escuro.svg" 
                  alt="Hold Arena" 
                  width={128}
                  height={128}
                  className="w-full h-full object-contain hidden dark:block animate-pulse"
                />
              </div>
              {/* Anel rotativo */}
              <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
          {/* Texto */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">Carregando seu feed personalizado</p>
            <p className="text-sm text-muted-foreground">Buscando os melhores conteúdos para você...</p>
          </div>
        </div>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Só mostrar mensagem vazia se não estiver carregando e realmente não houver posts
  if (posts.length === 0 && !isFetching && !isLoading) {
    let emptyMessage = 'Nenhum post ainda.';
    if (filterInteractions) {
      emptyMessage = 'Você ainda não interagiu com nenhum post.';
    } else if (filterMyPosts) {
      emptyMessage = 'Você ainda não criou nenhum post.';
    }
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
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

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div 
        ref={containerRef} 
        className={`relative h-full overflow-y-auto overflow-x-hidden scrollbar-hide md:scrollbar-hide ${
          (isFetchingNextPage || isLoadingMore) ? 'pb-40' : ''
        }`}
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Pull-to-refresh indicator - animação melhorada e mais fluida */}
        {shouldShowPullIndicator && (
          <div
            className="flex items-center justify-center absolute top-0 left-0 right-0 z-50 pointer-events-none"
            style={{
              opacity: isRefreshing ? 1 : Math.min(pullProgress * 1.5, 1),
              transform: `translateY(${isRefreshing ? 0 : Math.max(-50, pullDistance - 50)}px)`,
              height: `${isRefreshing ? 60 : Math.max(60, pullDistance)}px`,
              transition: isRefreshing ? 'all 0.3s ease-out' : 'opacity 0.2s, transform 0.1s',
            }}
          >
            <div className="bg-background/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-border/50">
              {isRefreshing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Atualizando...
                  </span>
                </div>
              ) : pullDistance > 60 ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Solte para atualizar
                  </span>
                </div>
              ) : (
                <RefreshCw
                  className="h-5 w-5 text-muted-foreground"
                  style={{
                    transform: `rotate(${pullProgress * 360}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                />
              )}
            </div>
          </div>
        )}
        
        {/* Botão de voltar ao topo */}
        <ScrollToTopButton containerRef={containerRef} />

        {/* Filtro integrado ao conteúdo */}
        {filterComponent && (
          <div className="mb-4">
            {filterComponent}
          </div>
        )}

        {/* Container de posts - ordem correta do backend (mais antigos no topo, mais recentes embaixo) */}
        <div className="space-y-4 pb-4 w-full min-w-0">
          {posts.map((post: any, index: number) => {
            const position = index + 1;
            const banner = getBannerForPosition(position);
            
            return (
              <div key={post.id} className="w-full min-w-0 space-y-4">
                <div data-post-id={post.id} className="w-full min-w-0">
                  <FeedPost post={post} isOwner={user?.id === post.userId} truncateContent={true} />
                </div>
                {/* Inserir banner a cada 5 posts */}
                {banner && (
                  <FeedBanner banner={banner} />
                )}
              </div>
            );
          })}
        </div>

        {/* Trigger para carregar mais posts quando scrolla para o final - sempre presente */}
        <div ref={loadMoreRef} className="h-20 flex-shrink-0" />
        
        {/* Loading quando carregando mais posts - sempre visível quando está carregando */}
        {(isFetchingNextPage || isLoadingMore) && (
          <div className="flex items-center justify-center py-12 px-4 min-h-[150px] w-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Carregando mais posts...</span>
            </div>
          </div>
        )}
        
        {/* Espaçamento extra quando não está carregando para garantir que o trigger seja visível */}
        {!isFetchingNextPage && !isLoadingMore && (
          <div className="h-4 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

