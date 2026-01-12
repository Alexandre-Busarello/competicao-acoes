'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, UserCheck, TrendingUp, CreditCard, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/client';
import { useEffect } from 'react';

interface AdminStats {
  leads: {
    total: number;
    converted: number;
    checkoutStarted: number;
    conversionRate: number;
    checkoutRate: number;
  };
  users: {
    total: number;
    withPro: number;
    userToProRate: number;
    recent: Array<{
      id: string;
      name: string;
      email: string | null;
      avatarUrl: string | null;
      createdAt: string;
      updatedAt: string;
      isPremium: boolean;
      subscription: {
        status: string;
        currentPeriodEnd: string | null;
        createdAt: string;
      } | null;
    }>;
  };
  subscriptions: {
    total: number;
    active: number;
    expired: number;
  };
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem acessar este painel.');
        }
        throw new Error('Erro ao buscar estatísticas');
      }
      return response.json();
    },
    enabled: !authLoading,
  });

  // Se não estiver autenticado, redirecionar
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral de leads, usuários e assinaturas
        </p>
      </div>

      {/* Métricas de Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.total.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Excluindo emails de teste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Convertidos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.converted.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa: {stats.leads.conversionRate}% (excluindo testes)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checkout Iniciado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.checkoutStarted.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa: {stats.leads.checkoutRate}% (excluindo testes)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários com PRO</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.withPro.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.users.userToProRate}% dos usuários
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Usuários e Assinaturas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.users.total.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Excluindo emails de teste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.subscriptions.active.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De {stats.subscriptions.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assinaturas Expiradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.subscriptions.expired.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Canceladas ou expiradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Usuários Acessados */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Usuários Acessados</CardTitle>
          <CardDescription>
            Últimos 50 usuários que acessaram o sistema (excluindo emails de teste)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.users.recent.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm">Usuário</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Criado em</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Último acesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.users.recent.map((user) => {
                      const isProActive = user.subscription?.status === 'active' &&
                        user.subscription.currentPeriodEnd &&
                        new Date(user.subscription.currentPeriodEnd) > new Date();

                      return (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {user.email || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {isProActive ? (
                              <Badge variant="default" className="bg-green-600">
                                PRO Ativo
                              </Badge>
                            ) : user.isPremium ? (
                              <Badge variant="secondary">Premium</Badge>
                            ) : (
                              <Badge variant="outline">Gratuito</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.updatedAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

