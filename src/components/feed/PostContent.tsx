'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/shared/ShareButton';
import { Heart, MessageCircle, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { getShareUrl } from '@/lib/utils/share';
import { getProfileUrlSync } from '@/lib/utils/profile-url';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PostComments } from './PostComments';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useRouter } from 'next/navigation';
import { renderMarkdownWithPolls } from '@/lib/utils/markdown-with-polls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostContentProps {
  slug: string;
}

export function PostContent({ slug }: PostContentProps) {
  const { user, isAuthenticated } = useUserStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch post');
      }
      return response.json();
    },
  });

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Função helper para atualizar post em todas as queries relacionadas
  const updatePostInAllQueries = (updater: (post: any) => any) => {
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
              p.id === post?.id ? updater(p) : p
            ),
          })),
        };
      }
    );

    // Atualizar em global-feed
    queryClient.setQueriesData(
      { queryKey: ['global-feed'] },
      (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: any) =>
              p.id === post?.id ? updater(p) : p
            ),
          })),
        };
      }
    );

    // Atualizar em post individual
    queryClient.setQueriesData(
      { queryKey: ['post', slug] },
      (old: any) => {
        if (!old || old.id !== post?.id) return old;
        return updater(old);
      }
    );
  };

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!post) throw new Error('Post not loaded');
      const response = await fetch(`/api/feed/${post.id}/like`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle like');
      return response.json();
    },
    // UI Otimista: atualiza imediatamente
    onMutate: async () => {
      if (!post) return;

      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: ['post', slug] });
      await queryClient.cancelQueries({ queryKey: ['user-feed'] });
      await queryClient.cancelQueries({ queryKey: ['global-feed'] });

      // Snapshot do estado anterior
      const previousLiked = liked;
      const previousLikeCount = likeCount;
      const newLiked = !previousLiked;
      const newLikeCount = newLiked ? previousLikeCount + 1 : previousLikeCount - 1;

      // Atualizar estado local
      setLiked(newLiked);
      setLikeCount(newLikeCount);

      // Atualizar em todos os caches
      updatePostInAllQueries((p) => ({
        ...p,
        likedByCurrentUser: newLiked,
        likeCount: Math.max(0, newLikeCount),
      }));

      return { previousLiked, previousLikeCount };
    },
    // Em caso de erro, reverter
    onError: (err, variables, context) => {
      console.error('Error toggling like:', err);
      if (context) {
        setLiked(context.previousLiked);
        setLikeCount(context.previousLikeCount);
        
        // Reverter em todos os caches
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
        queryClient.invalidateQueries({ queryKey: ['post', slug] });
        queryClient.invalidateQueries({ queryKey: ['user-feed'] });
        queryClient.invalidateQueries({ queryKey: ['global-feed'] });
      }, 1000);
    },
  });

  const handleLikeClick = () => {
    if (!isAuthenticated || !user) {
      // Redirecionar para login com returnUrl apontando para o post
      const postUrl = `/posts/${slug}`;
      router.push(`/auth/login?returnUrl=${encodeURIComponent(postUrl)}`);
      return;
    }
    toggleLikeMutation.mutate();
  };

  // Atualiza estado quando post carrega
  useEffect(() => {
    if (post) {
      setLiked(post.likedByCurrentUser || false);
      setLikeCount(post.likeCount || 0);
      setCommentCount(post.commentCount || 0);
    } else {
      setLiked(false);
      setLikeCount(0);
      setCommentCount(0);
    }
  }, [post]);

  const handleEdit = () => {
    if (!post) return;
    router.push(`/feed/${post.id}/edit`);
  };

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (!post) throw new Error('Post not loaded');
      const response = await fetch(`/api/feed/${post.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    // UI Otimista: remove imediatamente
    onMutate: async () => {
      if (!post) return;

      // Remover de todos os caches
      queryClient.setQueriesData(
        { queryKey: ['user-feed'] },
        (old: any) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: page.posts.filter((p: any) => p.id !== post.id),
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: ['global-feed'] },
        (old: any) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: page.posts.filter((p: any) => p.id !== post.id),
            })),
          };
        }
      );

      // Remover do cache do post individual
      queryClient.setQueryData(['post', slug], null);
    },
    // Em caso de erro, reverter (não fazemos rollback porque é difícil)
    onError: (err) => {
      console.error('Error deleting post:', err);
    },
    // Após sucesso, redirecionar para o feed
    onSuccess: () => {
      router.push('/feed');
    },
    // Sincronizar em background
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-feed'] });
        queryClient.invalidateQueries({ queryKey: ['global-feed'] });
        queryClient.invalidateQueries({ queryKey: ['post', slug] });
      }, 500);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Post não encontrado</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const shareUrl = getShareUrl('post', post.id, post.slug);
  const profileUrl = getProfileUrlSync(post.user.id, post.user.slug);
  const isOwner = user?.id === post.userId;

  const initials = post.user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Link href={profileUrl}>
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    {post.user.avatarUrl ? (
                      <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={profileUrl}>
                    <p className="font-semibold hover:underline truncate">
                      {post.user.name}
                    </p>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ShareButton
                  url={shareUrl}
                  title={post.content}
                  description={`Post de ${post.user.name}`}
                  variant="icon"
                  size="default"
                />
                {isOwner && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        aria-label="Mais opções"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-4 break-words text-lg">
              {renderMarkdownWithPolls(post.content, post.id, (post as any).pollId || undefined)}
            </div>

            {post.transaction && (
              <div className="mb-6 p-4 bg-muted/50 rounded-md">
                <p className="text-sm">
                  <span className="font-semibold">{post.transaction.ticker}</span>
                  {' • '}
                  {post.transaction.type === 'compra' ? 'Compra' : 'Venda'} de{' '}
                  {post.transaction.quantity} ações a R${' '}
                  {post.transaction.price.toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeClick}
                disabled={toggleLikeMutation.isPending || !post}
                className="flex items-center gap-2"
              >
                <Heart
                  className={`h-5 w-5 ${
                    liked
                      ? 'fill-destructive text-destructive'
                      : 'text-muted-foreground'
                  }`}
                />
                <span>{likeCount}</span>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{commentCount}</span>
              </div>
            </div>
            
            {/* Seção de comentários */}
            <PostComments 
              postId={post.id}
              postSlug={post.slug}
              onCommentAdded={() => {
                // Atualizar contador de comentários otimisticamente
                const newCount = commentCount + 1;
                setCommentCount(newCount);
                updatePostInAllQueries((p) => ({
                  ...p,
                  commentCount: newCount,
                }));
              }}
            />
          </CardContent>
        </Card>

        {/* Dialog de Excluir Post */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Post</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    await deletePostMutation.mutateAsync();
                    setIsDeleteDialogOpen(false);
                  } catch (error) {
                    // Erro já tratado na mutation
                  }
                }}
                disabled={deletePostMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletePostMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

