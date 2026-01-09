'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/shared/ShareButton';
import { Heart, MessageCircle, Eye, EyeOff, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/lib/store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { getShareUrl } from '@/lib/utils/share';
import ReactMarkdown from 'react-markdown';
import { PostComments } from './PostComments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedPostProps {
  post: {
    id: string;
    userId: string;
    slug: string;
    content: string;
    isPublic: boolean;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    transaction?: {
      ticker: string;
      type: string;
      quantity: number;
      price: number;
      date: string;
    };
    likedByCurrentUser?: boolean;
  };
  isOwner?: boolean;
}

export function FeedPost({ post, isOwner = false }: FeedPostProps) {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [liked, setLiked] = useState(post.likedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  // Função helper para atualizar post em todas as queries relacionadas
  const updatePostInAllQueries = (updater: (post: any) => any) => {
    // Atualizar em user-feed (todas as variações)
    queryClient.setQueriesData(
      { queryKey: ['user-feed'] },
      (old: any) => {
        if (!old) return old;
        if (old.pages) {
          // Infinite query
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
        return old;
      }
    );

    // Atualizar em global-feed
    queryClient.setQueriesData(
      { queryKey: ['global-feed'] },
      (old: any) => {
        if (!old) return old;
        if (old.pages) {
          // Infinite query
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
        return old;
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
      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: ['user-feed'] });
      await queryClient.cancelQueries({ queryKey: ['global-feed'] });
      await queryClient.cancelQueries({ queryKey: ['post', post.slug] });

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
      // Atualizar com dados do servidor
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

  const [isPublic, setIsPublic] = useState(post.isPublic);

  const toggleVisibilityMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/feed/${post.id}`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to toggle visibility');
      return response.json();
    },
    // UI Otimista: atualiza imediatamente
    onMutate: async () => {
      const previousIsPublic = isPublic;
      setIsPublic(!previousIsPublic);
      
      // Atualizar em todos os caches
      updatePostInAllQueries((p) => ({
        ...p,
        isPublic: !previousIsPublic,
      }));

      return { previousIsPublic };
    },
    // Em caso de erro, reverter
    onError: (err, variables, context) => {
      console.error('Error toggling visibility:', err);
      if (context) {
        setIsPublic(context.previousIsPublic);
        updatePostInAllQueries((p) => ({
          ...p,
          isPublic: context.previousIsPublic,
        }));
      }
    },
    // Após sucesso, atualizar com dados do servidor
    onSuccess: (data) => {
      setIsPublic(data.isPublic);
      updatePostInAllQueries((p) => ({
        ...p,
        isPublic: data.isPublic,
      }));
    },
    // Sincronizar em background
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-feed'] });
        queryClient.invalidateQueries({ queryKey: ['global-feed'] });
        queryClient.invalidateQueries({ queryKey: ['post', post.slug] });
      }, 500);
    },
  });

  const handleToggleVisibility = async () => {
    setIsTogglingVisibility(true);
    try {
      await toggleVisibilityMutation.mutateAsync();
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const updatePostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/feed/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    // UI Otimista: atualiza imediatamente
    onMutate: async (newContent: string) => {
      // Atualizar em todos os caches
      updatePostInAllQueries((p) => ({
        ...p,
        content: newContent,
      }));
    },
    // Em caso de erro, reverter
    onError: (err, variables, context) => {
      console.error('Error updating post:', err);
      // Reverter para conteúdo original
      updatePostInAllQueries((p) => ({
        ...p,
        content: post.content,
      }));
    },
    // Sincronizar em background
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-feed'] });
        queryClient.invalidateQueries({ queryKey: ['global-feed'] });
        queryClient.invalidateQueries({ queryKey: ['post', post.slug] });
      }, 500);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/feed/${post.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    // UI Otimista: remove imediatamente
    onMutate: async () => {
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
    },
    // Em caso de erro, reverter (não fazemos rollback porque é difícil)
    onError: (err) => {
      console.error('Error deleting post:', err);
    },
    // Sincronizar em background
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-feed'] });
        queryClient.invalidateQueries({ queryKey: ['global-feed'] });
        queryClient.invalidateQueries({ queryKey: ['post', post.slug] });
      }, 500);
    },
  });

  const shareUrl = getShareUrl('post', post.id, post.slug);
  const profileUrl = `/perfil/${post.user.id}`;
  const postUrl = `/post/${post.slug}`;

  const initials = post.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href={profileUrl}>
              <Avatar className="h-10 w-10 flex-shrink-0">
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
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleVisibility}
              disabled={isTogglingVisibility}
              className="flex-shrink-0"
              aria-label={isPublic ? 'Ocultar post' : 'Mostrar post'}
            >
              {isPublic ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href={postUrl} className="block">
          <div className="mb-4 break-words">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-2">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </Link>

        {post.transaction && (
          <div className="mb-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm">
              <span className="font-semibold">{post.transaction.ticker}</span>
              {' • '}
              {post.transaction.type === 'compra' ? 'Compra' : 'Venda'} de{' '}
              {post.transaction.quantity} ações a R${' '}
              {post.transaction.price.toFixed(2)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLikeMutation.mutate()}
              disabled={toggleLikeMutation.isPending}
              className="flex items-center gap-2"
            >
              <Heart
                className={`h-4 w-4 ${
                  liked
                    ? 'fill-destructive text-destructive'
                    : 'text-muted-foreground'
                }`}
              />
              <span className="text-sm">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2"
            >
              <MessageCircle className={`h-4 w-4 ${showComments ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm">{commentCount}</span>
            </Button>
          </div>
          <ShareButton
            url={shareUrl}
            title={post.content}
            description={`Post de ${post.user.name}`}
            variant="icon"
            size="sm"
          />
        </div>
        {showComments && (
          <PostComments 
            postId={post.id} 
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
        )}
      </CardContent>

      {/* Dialog de Editar Post */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Post</DialogTitle>
            <DialogDescription>
              Edite o conteúdo do seu post.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[120px]"
            placeholder="Digite seu post..."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditContent(post.content);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  await updatePostMutation.mutateAsync(editContent.trim());
                  setIsEditDialogOpen(false);
                } catch (error) {
                  // Erro já tratado na mutation
                }
              }}
              disabled={!editContent.trim() || updatePostMutation.isPending}
            >
              {updatePostMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Excluir Post */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Post</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await deletePostMutation.mutateAsync();
                  setIsDeleteDialogOpen(false);
                } catch (error) {
                  // Erro já tratado na mutation
                }
              }}
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

