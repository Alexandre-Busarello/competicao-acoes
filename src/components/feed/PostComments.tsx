'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MoreVertical, Edit, Trash2, Check, X } from 'lucide-react';
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
import { useUserStore } from '@/lib/store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useRouter } from 'next/navigation';

interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  replies?: Comment[];
}

interface PostCommentsProps {
  postId: string;
  postSlug?: string;
  onCommentAdded?: () => void;
}

export function PostComments({ postId, postSlug, onCommentAdded }: PostCommentsProps) {
  const { user, isAuthenticated } = useUserStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await fetch(`/api/feed/${postId}/comment`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    },
  });

  // Função helper para atualizar contador de comentários em todas as queries
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
              p.id === postId
                ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) + increment) }
                : p
            ),
          })),
        };
      }
    );

    // Atualizar em post individual
    queryClient.setQueriesData(
      { queryKey: ['post'] },
      (old: any) => {
        if (!old || old.id !== postId) return old;
        return {
          ...old,
          commentCount: Math.max(0, (old.commentCount || 0) + increment),
        };
      }
    );
  };

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/feed/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      return response.json();
    },
    // UI Otimista: adiciona comentário imediatamente
    onMutate: async (content: string) => {
      if (!user) return;

      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      await queryClient.cancelQueries({ queryKey: ['user-feed'] });
      await queryClient.cancelQueries({ queryKey: ['global-feed'] });
      await queryClient.cancelQueries({ queryKey: ['post'] });

      // Snapshot do estado anterior
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]) || [];

      // Criar comentário otimista
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        userId: user.id,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name || 'Você',
          avatarUrl: user.avatarUrl ?? null,
        },
      };

      // Atualizar cache de comentários
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) => [
        optimisticComment,
        ...old,
      ]);

      // Atualizar contador de comentários em todos os feeds
      updateCommentCountInAllQueries(1);
      
      // Notificar componente pai
      onCommentAdded?.();

      return { previousComments };
    },
    // Em caso de erro, reverter
    onError: (err, variables, context) => {
      console.error('Error adding comment:', err);
      if (context) {
        // Reverter comentários
        queryClient.setQueryData(['comments', postId], context.previousComments);
        // Reverter contador
        updateCommentCountInAllQueries(-1);
      }
    },
    // Após sucesso, substituir comentário otimista pelo real
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) => {
        // Remove comentário otimista e adiciona o real no início
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar autenticação antes de permitir comentar
    if (!isAuthenticated || !user) {
      // Construir URL de retorno baseada no slug do post ou URL atual
      const returnUrl = postSlug 
        ? `/posts/${postSlug}` 
        : (typeof window !== 'undefined' ? window.location.pathname : '/feed');
      router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    if (!commentContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(commentContent.trim());
      setCommentContent(''); // Limpar campo após sucesso
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border-t pt-4 mt-4">
      {/* Formulário de comentário */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name || ''} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(user.name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Adicione um comentário..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentContent.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Comentar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = user?.id === comment.userId;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  // Sincronizar conteúdo quando comentário mudar
  useEffect(() => {
    if (!isEditing) {
      setEditContent(comment.content);
    }
  }, [comment.content, isEditing]);

  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/feed/${postId}/comment/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update comment');
      return response.json();
    },
    // UI Otimista: atualiza imediatamente
    onMutate: async (content: string) => {
      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });

      // Snapshot do estado anterior
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]) || [];

      // Atualizar comentário otimisticamente
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) =>
        old.map((c) =>
          c.id === comment.id ? { ...c, content: content.trim() } : c
        )
      );

      return { previousComments };
    },
    // Em caso de erro, reverter
    onError: (err, variables, context) => {
      console.error('Error updating comment:', err);
      if (context) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
    // Após sucesso, atualizar com dados do servidor
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) =>
        old.map((c) => (c.id === comment.id ? updatedComment : c))
      );
      setIsEditing(false);
    },
    // Sincronizar em background
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }, 500);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/feed/${postId}/comment/${comment.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }
    await updateCommentMutation.mutateAsync(editContent.trim());
  };

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        {comment.user.avatarUrl ? (
          <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {getInitials(comment.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-sm">{comment.user.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
              {isOwner && !isEditing && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      aria-label="Mais opções"
                    >
                      <MoreVertical className="h-3 w-3" />
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
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                disabled={updateCommentMutation.isPending}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateCommentMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || editContent.trim() === comment.content || updateCommentMutation.isPending}
                >
                  {updateCommentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {comment.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {/* Respostas */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 ml-4 space-y-2 border-l-2 border-muted pl-4">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  {reply.user.avatarUrl ? (
                    <AvatarImage src={reply.user.avatarUrl} alt={reply.user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(reply.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-xs">{reply.user.name}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="text-xs break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                        }}
                      >
                        {reply.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCommentMutation.mutate()}
                disabled={deleteCommentMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteCommentMutation.isPending ? (
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

