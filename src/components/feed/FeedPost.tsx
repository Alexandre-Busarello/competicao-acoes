'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/shared/ShareButton';
import { Heart, MessageCircle, Eye, EyeOff, MoreVertical, Edit, Trash2, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/lib/store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { getShareUrl } from '@/lib/utils/share';
import { getProfileUrlSync } from '@/lib/utils/profile-url';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { PostComments } from './PostComments';
import { renderMarkdownWithPolls } from '@/lib/utils/markdown-with-polls';
import { UserStatsBadge } from './UserStatsBadge';
import { UserMedalsBadge } from './UserMedalsBadge';
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
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { Lock } from 'lucide-react';

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
      slug?: string | null;
    };
    transaction?: {
      ticker: string;
      type: string;
      quantity: number;
      price: number;
      date: string;
    };
    likedByCurrentUser?: boolean;
    pollId?: string | null;
    rankings?: {
      monthly: number | null;
      annual: number | null;
      monthlyReturn?: number | null;
      annualReturn?: number | null;
    };
    profitability?: number;
    medals?: {
      gold: number;
      silver: number;
      bronze: number;
      total: number;
    };
  };
  isOwner?: boolean;
  truncateContent?: boolean; // Se true, trunca conteúdo para 255 caracteres no feed global
}

export function FeedPost({ post, isOwner = false, truncateContent = false }: FeedPostProps) {
  const { user, isAuthenticated } = useUserStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [liked, setLiked] = useState(post.likedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Query para verificar se está seguindo o autor do post
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', post.userId],
    queryFn: async () => {
      if (!isAuthenticated || !user || isOwner || user.id === post.userId) {
        return { isFollowing: false };
      }
      const response = await fetch(`/api/users/${post.userId}/follow`);
      if (!response.ok) return { isFollowing: false };
      return response.json();
    },
    enabled: isAuthenticated && !!user && !isOwner && user.id !== post.userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const isFollowing = followStatus?.isFollowing || false;

  // Mutation para seguir/deixar de seguir
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${post.userId}/follow`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to follow');
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follow-status', post.userId] });
      const previousStatus = queryClient.getQueryData(['follow-status', post.userId]);
      
      queryClient.setQueryData(['follow-status', post.userId], (old: any) => ({
        isFollowing: !old?.isFollowing,
      }));

      return { previousStatus };
    },
    onError: (err, variables, context) => {
      console.error('Error following user:', err);
      if (context?.previousStatus) {
        queryClient.setQueryData(['follow-status', post.userId], context.previousStatus);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['follow-status', post.userId],
        refetchType: 'none',
      });
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['follow-status', post.userId],
        });
      }, 1000);
    },
  });

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

  const handleEdit = () => {
    router.push(`/feed/${post.id}/edit`);
  };

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
  const profileUrl = getProfileUrlSync(post.user.id, post.user.slug);
  const postUrl = `/posts/${post.slug}`;
  // URL para checkout - redireciona para perfil do usuário atual com parâmetro de compra
  const checkoutUrl = '/perfil?from=cta';

  const handleLikeClick = () => {
    if (!isAuthenticated || !user) {
      // Redirecionar para login com returnUrl apontando para o post
      router.push(`/auth/login?returnUrl=${encodeURIComponent(postUrl)}`);
      return;
    }
    toggleLikeMutation.mutate();
  };

  const handleCommentClick = () => {
    if (!isAuthenticated || !user) {
      // Redirecionar para login com returnUrl apontando para o post
      router.push(`/auth/login?returnUrl=${encodeURIComponent(postUrl)}`);
      return;
    }
    setShowComments(!showComments);
  };

  // Truncar conteúdo para 255 caracteres no feed global
  const MAX_CONTENT_LENGTH = 255;
  const shouldTruncate = truncateContent && post.content.length > MAX_CONTENT_LENGTH;
  
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    // Truncar e procurar o último espaço antes do limite para não cortar palavras
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    // Se encontrou um espaço próximo ao limite (dentro de 20 caracteres), usar ele
    if (lastSpace > maxLength - 20) {
      return truncated.slice(0, lastSpace) + '...';
    }
    return truncated + '...';
  };
  
  const displayContent = shouldTruncate 
    ? truncateText(post.content, MAX_CONTENT_LENGTH)
    : post.content;

  // Verificar se o conteúdo contém ticker ou valor ofuscado (XXXX)
  const hasObfuscatedTicker = !user?.isPremium && (
    displayContent.includes('**XXXX**') || 
    displayContent.includes(' XXXX ') ||
    displayContent.includes('R$ XXXX') ||
    (post.transaction && (post.transaction.ticker === 'XXXX' || post.transaction.price === 0))
  );

  const initials = post.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Função helper para verificar se um elemento contém XXXX e aplicar blur
  const createBlurredStrong = (children: React.ReactNode) => {
    const text = typeof children === 'string' ? children : 
                 Array.isArray(children) ? children.join('') : 
                 String(children);
    
    if (text.includes('XXXX') && !user?.isPremium) {
      return (
        <strong 
          className="font-semibold blur-sm select-none relative group"
          style={{ filter: 'blur(4px)' }}
        >
          {children}
        </strong>
      );
    }
    return <strong className="font-semibold">{children}</strong>;
  };

  return (
    <Card className="mb-4 w-full overflow-hidden mx-0 max-w-full">
      <CardHeader className="pb-3 overflow-hidden">
        <div className="flex items-start justify-between min-w-0 w-full">
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
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={profileUrl}>
                  <p className="font-semibold hover:underline truncate">
                    {post.user.name}
                  </p>
                </Link>
                <UserMedalsBadge medals={post.medals} />
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
                <UserStatsBadge
                  userId={post.userId}
                  rankings={post.rankings}
                  profitability={post.profitability}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
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
                {isOwner ? (
                  <>
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
                  </>
                ) : (
                  isAuthenticated && user && user.id !== post.userId && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAuthenticated || !user) {
                          router.push(`/auth/login?returnUrl=${encodeURIComponent(postUrl)}`);
                          return;
                        }
                        followMutation.mutate();
                      }}
                      disabled={followMutation.isPending}
                    >
                      {followMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Deixar de seguir
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Seguir
                        </>
                      )}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 overflow-hidden max-w-full">
        {shouldTruncate ? (
          <Link href={postUrl} className="block">
            <div className="mb-4 break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => createBlurredStrong(children),
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
                {displayContent}
              </ReactMarkdown>
              <span className="text-primary font-semibold mt-2 inline-block">
                Ver mais
              </span>
            </div>
          </Link>
        ) : (
          <div className="mb-4 break-words">
            {renderMarkdownWithPolls(
              displayContent, 
              post.id, 
              post.pollId || undefined,
              hasObfuscatedTicker // Passar flag para aplicar blur
            )}
            {hasObfuscatedTicker && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <a
                  href={checkoutUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Redirecionar para perfil com parâmetro de compra
                    window.location.href = checkoutUrl;
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Lock className="h-3 w-3" />
                  <span>Dado exclusivo para membros Pro</span>
                </a>
              </div>
            )}
          </div>
        )}

        {post.transaction && (
          <div className="mb-4 p-3 bg-muted/50 rounded-md relative overflow-hidden max-w-full">
            <p className="text-sm break-words">
              <span 
                className={`font-semibold ${!user?.isPremium ? 'blur-sm select-none' : ''}`}
                style={!user?.isPremium ? { filter: 'blur(4px)' } : {}}
              >
                {post.transaction.ticker}
              </span>
              {' • '}
              {post.transaction.type === 'compra' ? 'Compra' : 'Venda'} de{' '}
              {post.transaction.quantity} ações a{' '}
              <span 
                className={!user?.isPremium ? 'blur-sm select-none' : ''}
                style={!user?.isPremium ? { filter: 'blur(4px)' } : {}}
              >
                R$ {post.transaction.price === 0 ? 'XXXX' : post.transaction.price.toFixed(2)}
              </span>
            </p>
            {hasObfuscatedTicker && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <a
                  href={checkoutUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Redirecionar para perfil com parâmetro de compra
                    window.location.href = checkoutUrl;
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Lock className="h-3 w-3" />
                  <span>Dado exclusivo para membros Pro</span>
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t min-w-0 w-full">
          <div className="flex items-center gap-4 min-w-0 flex-shrink">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLikeClick();
              }}
              onTouchStart={(e) => {
                // Permitir scroll mesmo quando toca no botão
                e.stopPropagation();
              }}
              disabled={toggleLikeMutation.isPending}
              className="flex items-center gap-2 touch-manipulation"
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
              onClick={(e) => {
                e.stopPropagation();
                handleCommentClick();
              }}
              onTouchStart={(e) => {
                // Permitir scroll mesmo quando toca no botão
                e.stopPropagation();
              }}
              className="flex items-center gap-2 touch-manipulation"
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
        )}
      </CardContent>

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

