'use client';

import { useQuery } from '@tanstack/react-query';
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

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['user-feed', userId, includePrivate || isOwner],
    queryFn: async () => {
      const url = new URL(`/api/users/${userId}/feed`, window.location.origin);
      url.searchParams.set('limit', '100'); // Limite maior para mostrar mais posts de uma vez
      if (includePrivate || isOwner) {
        url.searchParams.set('includePrivate', 'true');
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
  });

  const posts = data?.posts || [];

  // Mostrar loading enquanto está carregando
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
    <div className="relative h-[600px] overflow-y-auto overflow-x-hidden scrollbar-hide md:scrollbar-hide">
      {/* Container de posts - mais recentes primeiro */}
      <div className="space-y-4 pb-4 w-full min-w-0">
        {posts.map((post: any) => (
          <div key={post.id} className="w-full min-w-0">
            <FeedPost post={post} isOwner={isOwner} />
          </div>
        ))}
      </div>
    </div>
  );
}

