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
  requestNotificationPermission,
} from '@/lib/utils/push-notification-support';
import { Bell, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight, Smartphone, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useDeviceSubscriptions } from '@/lib/hooks/useDeviceSubscriptions';
import { detectDeviceType, getDeviceName, generateDeviceId, getUserAgent } from '@/lib/utils/device-detection';

/**
 * Componente compacto de status de notificações para página de perfil
 */
export function NotificationStatusCard() {
  const { preferences, isLoading } = usePushNotificationPreferences();
  const { subscriptions, isLoading: isLoadingDevices } = useDeviceSubscriptions();
  const [support, setSupport] = useState<Awaited<ReturnType<typeof checkPushNotificationSupport>> | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supportInfo = await checkPushNotificationSupport();
      setSupport(supportInfo);
      const perm = await checkNotificationPermission();
      setPermission(perm);
      
      // Verificar se tem subscription registrada no servidor
      try {
        const response = await fetch('/api/push/subscribe', { method: 'HEAD' });
        setHasSubscription(response.status === 200);
      } catch {
        setHasSubscription(false);
      }
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

  const serviceWorkerActive = support?.serviceWorkerActive ?? false;
  const isPWA = support?.pwaInstalled ?? false;
  const isEnabled = preferences?.allEnabled ?? false;
  const hasPermission = permission === 'granted';
  
  // Contar dispositivos ativos
  const activeDevices = subscriptions?.filter(d => d.enabled) || [];
  const currentDeviceId = typeof window !== 'undefined' ? generateDeviceId() : null;
  const currentDevice = subscriptions?.find(d => d.deviceId === currentDeviceId) || 
                        subscriptions?.find(d => d.enabled) || null;

  // Função para ativar notificações do zero
  const handleRegisterSubscription = async () => {
    setIsRegistering(true);
    try {
      // Verificar se tem permissão
      let currentPermission = await checkNotificationPermission();
      
      // Se não tem permissão, solicitar
      if (currentPermission !== 'granted') {
        try {
          currentPermission = await requestNotificationPermission();
        } catch (error: any) {
          if (error.message?.includes('negada')) {
            alert('As notificações foram bloqueadas anteriormente. Por favor, ative manualmente nas configurações do navegador.');
            setIsRegistering(false);
            return;
          }
          throw error;
        }
        
        if (currentPermission !== 'granted') {
          if (currentPermission === 'denied') {
            alert('As notificações foram bloqueadas. Por favor, ative manualmente nas configurações do navegador.');
          }
          setPermission(currentPermission);
          setIsRegistering(false);
          return;
        }
        setPermission(currentPermission);
      }

      // Verificar se service worker está ativo
      if (!serviceWorkerActive) {
        alert('O Service Worker não está ativo. Por favor, aguarde alguns segundos e tente novamente.');
        setIsRegistering(false);
        return;
      }

      // Aguardar service worker estar pronto
      const registration = await navigator.serviceWorker.ready;
      
      // Buscar chave VAPID pública do servidor
      const vapidKeyResponse = await fetch('/api/push/vapid-public-key');
      if (!vapidKeyResponse.ok) {
        throw new Error('Não foi possível obter chave VAPID');
      }
      const { publicKey } = await vapidKeyResponse.json();
      
      // Converter chave para formato correto
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      
      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Detectar informações do dispositivo
      const deviceId = generateDeviceId();
      const deviceName = getDeviceName();
      const deviceType = detectDeviceType();
      const userAgent = getUserAgent();

      // Enviar subscription para o servidor
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!),
          },
          deviceId,
          deviceName,
          deviceType,
          userAgent,
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Erro ao registrar subscription');
      }

      setHasSubscription(true);
      const supportInfo = await checkPushNotificationSupport();
      setSupport(supportInfo);
      
      // Atualizar permissão também
      const updatedPermission = await checkNotificationPermission();
      setPermission(updatedPermission);
      
      console.log('✅ Notificações ativadas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao registrar subscription:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      if (errorMessage.includes('service worker')) {
        alert('O Service Worker não está ativo. Por favor, aguarde alguns segundos e tente novamente.');
      } else {
        alert(`Erro ao ativar notificações: ${errorMessage}`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Utilitários para conversão de chaves VAPID
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

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
    if (!serviceWorkerActive) {
      return {
        icon: AlertCircle,
        text: 'Service Worker inativo',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      };
    }
    if (hasSubscription === false) {
      return {
        icon: AlertCircle,
        text: 'Subscription não registrada',
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
              {permission === 'granted' ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Permitido</span>
                </>
              ) : permission === 'denied' ? (
                <>
                  <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">Bloqueado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-600 dark:text-amber-400">Não solicitado</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Service Worker:</span>
            <div className="flex items-center gap-1">
              {serviceWorkerActive ? (
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
          {hasSubscription !== null && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subscription:</span>
              <div className="flex items-center gap-1">
                {hasSubscription ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Registrada</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400">Não registrada</span>
                  </>
                )}
              </div>
            </div>
          )}
          {isPWA && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">PWA:</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">Instalado</span>
              </div>
            </div>
          )}
          {currentDevice && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dispositivo atual:</span>
              <div className="flex items-center gap-1">
                {currentDevice.deviceType === 'mobile' ? (
                  <Smartphone className="h-3 w-3 text-muted-foreground" />
                ) : currentDevice.deviceType === 'desktop' ? (
                  <Monitor className="h-3 w-3 text-muted-foreground" />
                ) : null}
                <span className="text-muted-foreground text-xs truncate max-w-[120px]">
                  {currentDevice.deviceName === 'Outro' && currentDevice.deviceType === 'unknown'
                    ? 'Outro'
                    : currentDevice.deviceName}
                </span>
                {currentDevice.enabled ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 ml-1" />
                ) : (
                  <XCircle className="h-3 w-3 text-muted-foreground ml-1" />
                )}
              </div>
            </div>
          )}
          {activeDevices.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Outros dispositivos:</span>
              <span className="text-xs text-muted-foreground">
                {activeDevices.length - 1} ativo{activeDevices.length - 1 > 1 ? 's' : ''}
              </span>
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

        {/* Botão para ativar notificações do zero */}
        {permission !== 'granted' && (
          <Button
            onClick={handleRegisterSubscription}
            disabled={isRegistering || permission === 'denied' || !serviceWorkerActive}
            className="w-full mt-2"
            size="sm"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <Bell className="h-3 w-3 mr-2" />
                {permission === 'denied' ? 'Ativar nas Configurações' : 'Ativar Notificações'}
              </>
            )}
          </Button>
        )}
        
        {/* Botão para registrar subscription quando já tem permissão mas não tem subscription */}
        {permission === 'granted' && serviceWorkerActive && hasSubscription === false && (
          <Button
            onClick={handleRegisterSubscription}
            disabled={isRegistering}
            className="w-full mt-2"
            size="sm"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Bell className="h-3 w-3 mr-2" />
                Registrar Subscription
              </>
            )}
          </Button>
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

