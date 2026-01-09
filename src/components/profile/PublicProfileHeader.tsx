'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShareButton } from '@/components/shared/ShareButton';
import { UserPlus, UserMinus, Loader2, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { getShareUrl } from '@/lib/utils/share';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface PublicProfileHeaderProps {
  userId: string;
}

export function PublicProfileHeader({ userId }: PublicProfileHeaderProps) {
  const { user: currentUser } = useUserStore();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.id === userId;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/public`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to follow');
      return response.json();
    },
    // UI Otimista: atualiza o cache antes da requisição completar
    onMutate: async () => {
      // Cancelar queries em andamento para evitar sobrescrever a atualização otimista
      await queryClient.cancelQueries({ queryKey: ['public-profile', userId] });

      // Snapshot do valor anterior
      const previousProfile = queryClient.getQueryData(['public-profile', userId]);

      // Atualização otimista: inverte o estado de seguir
      queryClient.setQueryData(['public-profile', userId], (old: any) => {
        if (!old) return old;
        const newIsFollowing = !old.isFollowing;
        return {
          ...old,
          isFollowing: newIsFollowing,
          stats: {
            ...old.stats,
            followerCount: newIsFollowing
              ? Math.max(0, old.stats.followerCount + 1)
              : Math.max(0, old.stats.followerCount - 1),
          },
        };
      });

      // Retornar contexto com snapshot para rollback em caso de erro
      return { previousProfile };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (err, variables, context) => {
      console.error('Error following user:', err);
      if (context?.previousProfile) {
        queryClient.setQueryData(['public-profile', userId], context.previousProfile);
      }
    },
    // Após sucesso, invalidar para buscar dados atualizados do servidor em background
    onSuccess: () => {
      // Invalidar em background sem bloquear a UI
      // Usa refetchType: 'none' para não refazer fetch imediatamente
      queryClient.invalidateQueries({ 
        queryKey: ['public-profile', userId],
        refetchType: 'none',
      });
    },
    // Sempre refazer fetch após a mutation completar para sincronizar com servidor
    onSettled: () => {
      // Refazer fetch em background após um pequeno delay para garantir que o servidor processou
      // Isso garante que os dados estejam sincronizados, mas não bloqueia a UI
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['public-profile', userId],
        });
      }, 1000);
    },
  });

  const { data: profitabilityData } = useQuery({
    queryKey: ['perpetual-profitability', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/perpetual-profitability`);
      if (!response.ok) throw new Error('Failed to fetch profitability');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4 sm:p-6">
          <p className="text-center text-muted-foreground">Perfil não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const shareUrl = getShareUrl('profile', userId);
  const memberSince = formatDistanceToNow(new Date(profile.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const profitability = profitabilityData?.profitability || 0;
  const isPositive = profitability >= 0;

  return (
    <Card className="mb-4">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          {/* Mobile: Avatar + Rentabilidade | Desktop: Apenas Avatar */}
          <div className="flex items-center gap-3 sm:contents justify-between w-full">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Mobile: Rentabilidade na mesma div do avatar */}
            {profitabilityData && (
              <div className="flex items-start gap-2 sm:hidden flex-shrink-0">
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Rent. Perpétua</p>
                  <p
                    className={`text-lg font-bold ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {profitability.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 w-full sm:w-auto">
            {/* Desktop: Nome + Rentabilidade + Botão Compartilhar alinhados */}
            <div className="flex items-start sm:items-center justify-between gap-3 mb-0.5 sm:mb-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate flex-1 min-w-0">
                {profile.name}
              </h1>
              
              {/* Desktop: Rentabilidade + Botão Compartilhar alinhados */}
              <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                {profitabilityData && (
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Rent. Perpétua</p>
                      <p
                        className={`text-xl font-bold ${
                          isPositive ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {profitability.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}
                <ShareButton
                  url={shareUrl}
                  title={`Perfil de ${profile.name}`}
                  description={`Veja o perfil de ${profile.name} na Competição de Ações`}
                  variant="button"
                  size="sm"
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Membro desde {memberSince}
            </p>

            {/* Posições nos rankings vigentes */}
            {(profile.rankings?.monthly || profile.rankings?.annual) && (
              <div className="flex flex-wrap gap-3 mb-3 sm:mb-4">
                {profile.rankings.monthly && (
                  <Link
                    href={`/ranking/mensal/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-sm"
                  >
                    <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Mensal:</span>
                    <span className="font-semibold">#{profile.rankings.monthly}</span>
                  </Link>
                )}
                {profile.rankings.annual && (
                  <Link
                    href={`/ranking/anual/${new Date().getFullYear()}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-sm"
                  >
                    <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Anual:</span>
                    <span className="font-semibold">#{profile.rankings.annual}</span>
                  </Link>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <div>
                <p className="text-lg sm:text-2xl font-bold">{profile.stats.followerCount}</p>
                <p className="text-xs text-muted-foreground">Seguidores</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{profile.stats.followingCount}</p>
                <p className="text-xs text-muted-foreground">Seguindo</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{profile.stats.postCount}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{profile.stats.totalLikesReceived}</p>
                <p className="text-xs text-muted-foreground">Curtidas</p>
              </div>
            </div>
          </div>

          {/* Mobile: Botões de ação */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:hidden">
            {!isOwnProfile && currentUser && (
              <Button
                variant={profile.isFollowing ? 'outline' : 'default'}
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="flex-1 text-sm"
                size="sm"
              >
                {followMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : profile.isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Seguindo
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Seguir
                  </>
                )}
              </Button>
            )}
            <ShareButton
              url={shareUrl}
              title={`Perfil de ${profile.name}`}
              description={`Veja o perfil de ${profile.name} na Competição de Ações`}
              variant="button"
              size="sm"
            />
          </div>

          {/* Desktop: Botão de seguir */}
          {!isOwnProfile && currentUser && (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <Button
                variant={profile.isFollowing ? 'outline' : 'default'}
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="text-sm"
                size="sm"
              >
                {followMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : profile.isFollowing ? (
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
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

