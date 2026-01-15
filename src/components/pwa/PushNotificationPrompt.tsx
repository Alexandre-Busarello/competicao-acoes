'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  checkPushNotificationSupport,
  checkNotificationPermission,
  requestNotificationPermission,
  isPWAInstalled,
} from '@/lib/utils/push-notification-support';
import { useAuth } from '@/lib/auth/client';
import { detectDeviceType, getDeviceName, generateDeviceId, getUserAgent } from '@/lib/utils/device-detection';

const STORAGE_KEY = 'push-notification-prompt-dismissed';

/**
 * Componente elegante para solicitar permissão de notificações push
 */
export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [support, setSupport] = useState<Awaited<ReturnType<typeof checkPushNotificationSupport>> | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const checkSupport = async () => {
      const supportInfo = await checkPushNotificationSupport();
      setSupport(supportInfo);

      // Verificar se já foi dispensado
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        // Verificar se passou 7 dias desde o dismiss
        try {
          const dismissedDate = new Date(dismissed);
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceDismissed < 7) {
            return; // Ainda está no período de cooldown
          }
          // Passou 7 dias, pode mostrar novamente
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          // Se não conseguir parsear a data, assumir que foi dispensado recentemente
          return;
        }
      }

      // Verificar permissão atual
      const permission = await checkNotificationPermission();

      if (permission === 'granted') {
        setStatus('granted');
        // Esconder após 3 segundos
        setTimeout(() => setShow(false), 3000);
        return;
      }

      if (permission === 'denied') {
        setStatus('denied');
        setShow(true);
        return;
      }

      if (!supportInfo.pushSupported || !supportInfo.serviceWorkerActive) {
        setStatus('unsupported');
        return;
      }

      // Mostrar prompt após algumas interações (simulado com delay)
      // Em produção, você pode rastrear interações reais
      const timer = setTimeout(() => {
        setShow(true);
        setStatus('idle');
      }, 5000); // Mostrar após 5 segundos

      return () => clearTimeout(timer);
    };

    checkSupport();
  }, [isAuthenticated]);

  const handleRequestPermission = async () => {
    setStatus('requesting');

    try {
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        setStatus('granted');

        // Registrar subscription automaticamente
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Buscar chave VAPID pública do servidor
          const vapidKeyResponse = await fetch('/api/push/vapid-public-key');
          if (!vapidKeyResponse.ok) {
            throw new Error('Não foi possível obter chave VAPID');
          }
          const { publicKey } = await vapidKeyResponse.json();
          
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
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
            throw new Error('Erro ao registrar subscription no servidor');
          }

          console.log('✅ Subscription registrada com sucesso via PushNotificationPrompt');

          // Esconder após 3 segundos
          setTimeout(() => setShow(false), 3000);
        } catch (error) {
          console.error('Erro ao registrar subscription:', error);
          setStatus('denied');
        }
      } else {
        setStatus('denied');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setStatus('denied');
    }
  };

  const handleDismiss = () => {
    // Salvar timestamp atual em vez de apenas 'true'
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setShow(false);
  };

  const handleOpenSettings = () => {
    // Abrir configurações do navegador (não há API universal, mas podemos mostrar instruções)
    alert('Para ativar notificações:\n\n1. Clique no ícone de cadeado/segurança na barra de endereços\n2. Procure por "Notificações"\n3. Altere para "Permitir"');
  };

  if (!show || !isAuthenticated) {
    return null;
  }

  const isPWA = support?.pwaInstalled ?? false;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ativar Notificações</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {isPWA
              ? 'Receba atualizações mesmo quando o app estiver fechado'
              : 'Receba notificações sobre ranking, posts populares e muito mais'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Mudanças no seu ranking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Posts populares da comunidade</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Atividades de pessoas que você segue</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-3">
          {status === 'granted' && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 w-full">
              <CheckCircle2 className="h-4 w-4" />
              <span>Notificações ativadas com sucesso!</span>
            </div>
          )}
          {status === 'denied' && (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Permissão negada. Ative manualmente nas configurações.</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleOpenSettings} className="w-full">
                Ver Instruções
              </Button>
            </div>
          )}
          {status === 'idle' && (
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleRequestPermission}
                className="flex-1"
              >
                Ativar Notificações
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
            </div>
          )}
          {status === 'requesting' && (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Solicitando permissão...
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

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

