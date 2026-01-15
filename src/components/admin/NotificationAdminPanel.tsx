'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Users, Smartphone, AlertCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
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

interface NotificationStats {
  totalUsers: number;
  pwaInstalled: number;
  notificationsActive: number;
  inactive7Days: number;
}

interface BroadcastResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
}

export function NotificationAdminPanel() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<NotificationStats>({
    queryKey: ['admin-notification-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications/stats');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem acessar.');
        }
        throw new Error('Erro ao buscar estatísticas');
      }
      return response.json();
    },
  });

  // Mutation para broadcast
  const broadcastMutation = useMutation<BroadcastResult, Error, { title: string; body: string; url?: string }>({
    mutationFn: async (data) => {
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar notificações');
      }

      return response.json();
    },
    onSuccess: () => {
      setTitle('');
      setBody('');
      setUrl('/');
      setShowConfirmDialog(false);
      refetchStats();
    },
  });

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = () => {
    broadcastMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      url: url.trim() || undefined,
    });
  };

  if (statsLoading) {
    return (
      <PageLoading
        title="Carregando estatísticas"
        description="Buscando dados de notificações..."
      />
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PWA Instalado</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pwaInstalled.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? `${((stats.pwaInstalled / stats.totalUsers) * 100).toFixed(1)}% dos usuários`
                : '0% dos usuários'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações Ativas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.notificationsActive.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Com subscription e preferências habilitadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos 7+ Dias</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.inactive7Days.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Elegíveis para re-engajamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Broadcast */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Notificação para Todos</CardTitle>
          <CardDescription>
            Envie uma notificação push manual para todos os usuários com notificações ativas.
            O rate limit será ignorado para este envio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Nova funcionalidade disponível!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Corpo da Mensagem *</Label>
            <Textarea
              id="body"
              placeholder="Ex: Confira as novas funcionalidades que acabamos de lançar..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/500 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL de Destino (opcional)</Label>
            <Input
              id="url"
              placeholder="/ranking"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL para onde o usuário será redirecionado ao clicar na notificação
            </p>
          </div>

          {/* Preview */}
          {(title || body) && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Preview da Notificação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-semibold">{title || '(Sem título)'}</div>
                  <div className="text-sm text-muted-foreground">
                    {body || '(Sem corpo)'}
                  </div>
                  {url && (
                    <div className="text-xs text-muted-foreground mt-2">
                      🔗 Link: {url}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              disabled={!title.trim() || !body.trim() || broadcastMutation.isPending}
              className="flex-1"
            >
              {broadcastMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Todos ({stats.notificationsActive.toLocaleString('pt-BR')} usuários)
                </>
              )}
            </Button>
          </div>

          {/* Resultado */}
          {broadcastMutation.isSuccess && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Notificações enviadas com sucesso!</div>
                    <div className="text-sm">
                      {broadcastMutation.data.sent} enviadas de {broadcastMutation.data.total} usuários
                      {broadcastMutation.data.failed > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          {' '}({broadcastMutation.data.failed} falhas)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {broadcastMutation.isError && (
            <Card className="border-red-500 bg-red-50 dark:bg-red-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Erro ao enviar notificações</div>
                    <div className="text-sm">
                      {broadcastMutation.error.message}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a enviar uma notificação push para{' '}
              <strong>{stats.notificationsActive.toLocaleString('pt-BR')} usuários</strong>.
              <br />
              <br />
              <strong>Título:</strong> {title}
              <br />
              <strong>Corpo:</strong> {body}
              <br />
              {url && (
                <>
                  <strong>URL:</strong> {url}
                </>
              )}
              <br />
              <br />
              Esta ação não pode ser desfeita. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>
              Confirmar e Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

