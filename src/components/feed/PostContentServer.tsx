import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getProfileUrlSync } from '@/lib/utils/profile-url';
import { renderMarkdownWithPolls } from '@/lib/utils/markdown-with-polls';
import type { FeedPost } from '@/lib/services/feed-service';

interface PostContentServerProps {
  post: FeedPost;
}

export function PostContentServer({ post }: PostContentServerProps) {
  const profileUrl = getProfileUrlSync(post.user.id, post.user.slug);
  
  // Verificar se há conteúdo ofuscado (para usuários não premium)
  const hasObfuscatedTicker = post.content.includes('**XXXX**') || 
    post.content.includes(' XXXX ') ||
    post.content.includes('R$ XXXX') ||
    (post.transaction && (post.transaction.ticker === 'XXXX' || post.transaction.price === 0));

  const initials = post.user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
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
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-4 break-words text-lg">
              {renderMarkdownWithPolls(
                post.content, 
                post.id, 
                post.pollId || undefined,
                hasObfuscatedTicker
              )}
              {hasObfuscatedTicker && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <a
                    href="/perfil?from=cta"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span>🔒</span>
                    <span>Dado exclusivo para membros Pro</span>
                  </a>
                </div>
              )}
            </div>

            {post.transaction && (
              <div className="mb-6 p-4 bg-muted/50 rounded-md relative">
                <p className="text-sm">
                  <span 
                    className={hasObfuscatedTicker ? 'blur-sm select-none' : ''}
                    style={hasObfuscatedTicker ? { filter: 'blur(4px)' } : {}}
                  >
                    {post.transaction.ticker}
                  </span>
                  {' • '}
                  {post.transaction.type === 'compra' ? 'Compra' : 'Venda'} de{' '}
                  {post.transaction.quantity} ações a{' '}
                  <span 
                    className={hasObfuscatedTicker ? 'blur-sm select-none' : ''}
                    style={hasObfuscatedTicker ? { filter: 'blur(4px)' } : {}}
                  >
                    R$ {post.transaction.price === 0 ? 'XXXX' : post.transaction.price.toFixed(2)}
                  </span>
                </p>
                {hasObfuscatedTicker && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <a
                      href="/perfil?from=cta"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span>🔒</span>
                      <span>Dado exclusivo para membros Pro</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>❤️</span>
                <span>{post.likeCount || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>💬</span>
                <span>{post.commentCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

