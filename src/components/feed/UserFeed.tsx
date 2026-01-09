'use client';

import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FeedPost } from './FeedPost';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';

interface UserFeedProps {
  userId: string;
  includePrivate?: boolean;
}

export function UserFeed({ userId, includePrivate = false }: UserFeedProps) {
  const { user } = useUserStore();
  const isOwner = user?.id === userId;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['user-feed', userId, includePrivate || isOwner],
    queryFn: async ({ pageParam }) => {
      const url = new URL(`/api/users/${userId}/feed`, window.location.origin);
      url.searchParams.set('limit', '20');
      if (pageParam) {
        url.searchParams.set('cursor', pageParam);
      }
      if (includePrivate || isOwner) {
        url.searchParams.set('includePrivate', 'true');
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: undefined as string | undefined,
  });

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

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Mostrar loading enquanto está carregando (isLoading ou isFetching na primeira carga)
  if (isLoading || (isFetching && !data)) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Só mostrar mensagem vazia se não estiver carregando e realmente não houver posts
  if (posts.length === 0 && !isFetching) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum post ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post: any) => (
        <FeedPost key={post.id} post={post} isOwner={isOwner} />
      ))}
      <div ref={loadMoreRef} className="h-10" />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

