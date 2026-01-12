'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Loader2, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/navigation/PageHeader';
import { PublicProfileHeader } from '@/components/profile/PublicProfileHeader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useProfileUrl } from '@/lib/hooks/use-profile-url';

export default function MedalTimelinePage({
  params,
}: {
  params: { userId: string };
}) {
  // params.userId pode ser slug ou ID - buscar perfil para obter ID real
  const { data: profile } = useQuery({
    queryKey: ['public-profile-by-slug-or-id', params.userId],
    queryFn: async () => {
      // Tentar buscar por slug primeiro, depois por ID
      const response = await fetch(`/api/users/${params.userId}/public`);
      if (!response.ok) return null;
      return response.json();
    },
  });
  
  const userId = profile?.id || params.userId;
  const profileUrl = useProfileUrl(userId);

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['medal-timeline', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/medals/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      const data = await response.json();
      return data.timeline;
    },
  });

  const getMedalIcon = (medalType: string) => {
    switch (medalType) {
      case 'gold':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'silver':
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 'bronze':
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getMedalLabel = (medalType: string) => {
    switch (medalType) {
      case 'gold':
        return 'Ouro';
      case 'silver':
        return 'Prata';
      case 'bronze':
        return 'Bronze';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Medalhas" backHref={profileUrl} />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <PublicProfileHeader userId={userId} />

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Medalhas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !timeline || timeline.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma medalha conquistada ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {timeline.map((medal: any) => {
                  const date = new Date(medal.calculatedAt);
                  const periodLabel =
                    medal.period === 'mensal'
                      ? format(date, "MMMM 'de' yyyy", { locale: ptBR })
                      : format(date, 'yyyy', { locale: ptBR });

                  return (
                    <div
                      key={medal.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {getMedalIcon(medal.medalType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {getMedalLabel(medal.medalType)} - {medal.period === 'mensal' ? 'Mensal' : 'Anual'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {periodLabel} • Posição #{medal.position}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground flex-shrink-0">
                        {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



