'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/page-loading';
import { BarChart3, MousePointerClick, Eye, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface BannerStats {
  id: string;
  variation: string;
  title: string;
  description: string;
  benefit: string;
  ctaText: string;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

interface BannerStatsResponse {
  banners: BannerStats[];
  totalBanners: number;
  activeBanners: number;
}

export default function AdminBannersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading, error } = useQuery<BannerStatsResponse>({
    queryKey: ['admin-banner-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/banners/stats');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem acessar este painel.');
        }
        throw new Error('Erro ao buscar estatísticas');
      }
      return response.json();
    },
    enabled: !authLoading,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Se não estiver autenticado, redirecionar
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || isLoading) {
    return (
      <PageLoading 
        title="Carregando estatísticas de banners"
        description="Buscando métricas e dados dos banners..."
      />
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Erro ao carregar painel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { banners, totalBanners, activeBanners } = stats;

  // Calcular totais gerais
  const totalImpressions = banners.reduce((sum, b) => sum + b.impressions, 0);
  const totalClicks = banners.reduce((sum, b) => sum + b.clicks, 0);
  const totalConversions = banners.reduce((sum, b) => sum + b.conversions, 0);
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallCVR = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estatísticas de Banners</h1>
          <p className="text-muted-foreground mt-2">
            Métricas de performance dos banners de conversão no feed
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin')}>
          Voltar ao Admin
        </Button>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Banners</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBanners}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeBanners} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Impressões</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Visualizações dos banners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              CTR: {overallCTR.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversões</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              CVR: {overallCVR.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Banners */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Banner</CardTitle>
          <CardDescription>
            Comparação detalhada de cada variação de banner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Variação</th>
                  <th className="text-left p-2 font-semibold">Título</th>
                  <th className="text-right p-2 font-semibold">Impressões</th>
                  <th className="text-right p-2 font-semibold">Cliques</th>
                  <th className="text-right p-2 font-semibold">CTR</th>
                  <th className="text-right p-2 font-semibold">Conversões</th>
                  <th className="text-right p-2 font-semibold">CVR</th>
                  <th className="text-right p-2 font-semibold">Prioridade</th>
                  <th className="text-center p-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <Badge variant="outline" className="font-mono">
                        {banner.variation}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{banner.title}</div>
                      <div className="text-xs text-muted-foreground">{banner.benefit}</div>
                    </td>
                    <td className="p-2 text-right">
                      {banner.impressions.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2 text-right">
                      {banner.clicks.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2 text-right">
                      <span className={banner.ctr > overallCTR ? 'text-green-600 font-semibold' : ''}>
                        {banner.ctr.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      {banner.conversions.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2 text-right">
                      <span className={banner.cvr > overallCVR ? 'text-green-600 font-semibold' : ''}>
                        {banner.cvr.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <Badge variant={banner.priority > 0 ? 'default' : 'secondary'}>
                        {banner.priority}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                        {banner.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Priorização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Como funciona a Priorização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Prioridade = Conversões × 1000 + Cliques</strong>
          </p>
          <p>
            A priorização considera apenas dados dos <strong>últimos 30 dias</strong> e só é aplicada para banners com pelo menos <strong>40 impressões</strong> neste período.
          </p>
          <p>
            O banner com maior prioridade aparece primeiro quando há múltiplos banners ativos.
            Se nenhum banner tiver conversões, a prioridade é baseada apenas no número de cliques.
            Banners com menos de 40 impressões recebem prioridade 0.
          </p>
          <p className="pt-2">
            <strong>Nota:</strong> Os banners aparecem a cada <strong>4 posts</strong> no feed, apenas para usuários não-PRO.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

