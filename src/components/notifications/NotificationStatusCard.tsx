'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePushNotificationPreferences } from '@/lib/hooks/usePushNotificationPreferences';
import {
  checkPushNotificationSupport,
  checkNotificationPermission,
  isPWAInstalled,
  checkServiceWorkerActive,
} from '@/lib/utils/push-notification-support';
import { Bell, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Componente compacto de status de notificações para página de perfil
 */
export function NotificationStatusCard() {
  const { preferences, isLoading } = usePushNotificationPreferences();
  const [support, setSupport] = useState<Awaited<ReturnType<typeof checkPushNotificationSupport>> | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const checkSupport = async () => {
      const supportInfo = await checkPushNotificationSupport();
      setSupport(supportInfo);
      const perm = await checkNotificationPermission();
      setPermission(perm);
    };
    checkSupport();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSubscription = support?.serviceWorkerActive ?? false;
  const isPWA = support?.pwaInstalled ?? false;
  const isEnabled = preferences?.allEnabled ?? false;
  const hasPermission = permission === 'granted';

  // Determinar status geral
  const getStatus = () => {
    if (!hasPermission) {
      return {
        icon: AlertCircle,
        text: 'Não configurado',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      };
    }
    if (!hasSubscription) {
      return {
        icon: AlertCircle,
        text: 'Service Worker inativo',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      };
    }
    if (!isEnabled) {
      return {
        icon: XCircle,
        text: 'Desativado',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
      };
    }
    return {
      icon: CheckCircle2,
      text: 'Ativo',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Contar tipos de notificação ativos
  const activeTypes = [
    preferences?.rankingEnabled && isEnabled ? 'Ranking' : null,
    preferences?.engagementEnabled && isEnabled ? 'Engajamento' : null,
    preferences?.followingEnabled && isEnabled ? 'Seguidos' : null,
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </CardTitle>
          <Link href="/perfil/notificacoes">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">
          Status e configurações de notificações push
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Geral */}
        <div className={`flex items-center gap-2 p-2 rounded-lg ${status.bgColor}`}>
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
        </div>

        {/* Detalhes Compactos */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Permissão:</span>
            <div className="flex items-center gap-1">
              {hasPermission ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Permitido</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">Bloqueado</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Service Worker:</span>
            <div className="flex items-center gap-1">
              {hasSubscription ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Ativo</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">Inativo</span>
                </>
              )}
            </div>
          </div>
          {isPWA && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">PWA:</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">Instalado</span>
              </div>
            </div>
          )}
        </div>

        {/* Tipos Ativos */}
        {isEnabled && activeTypes.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">Tipos ativos:</div>
            <div className="flex flex-wrap gap-1">
              {activeTypes.map((type) => (
                <span
                  key={type}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Link para configurações */}
        <Link href="/perfil/notificacoes">
          <Button variant="outline" size="sm" className="w-full mt-2">
            Gerenciar Configurações
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

