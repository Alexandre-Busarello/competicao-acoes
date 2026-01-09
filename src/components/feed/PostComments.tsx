'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

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
  onCommentAdded?: () => void;
}

export function PostComments({ postId, onCommentAdded }: PostCommentsProps) {
  const { user } = useUserStore();
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
    if (!commentContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(commentContent.trim());
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
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="text-sm break-words">
            <ReactMarkdown
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
      </div>
    </div>
  );
}

