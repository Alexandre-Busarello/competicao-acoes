'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePushNotificationPreferences } from '@/lib/hooks/usePushNotificationPreferences';
import {
  checkPushNotificationSupport,
  checkNotificationPermission,
  isPWAInstalled,
  checkServiceWorkerActive,
  requestNotificationPermission,
} from '@/lib/utils/push-notification-support';
import { Bell, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { pushNotificationService } from '@/lib/services/push-notification-service';

/**
 * Componente completo de configurações de notificações
 */
export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences, isUpdating } = usePushNotificationPreferences();
  const [support, setSupport] = useState<Awaited<ReturnType<typeof checkPushNotificationSupport>> | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingRanking, setIsTestingRanking] = useState(false);
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

  const handleToggle = async (field: 'rankingEnabled' | 'engagementEnabled' | 'followingEnabled' | 'allEnabled') => {
    if (!preferences) return;

    const newValue = !preferences[field];
    await updatePreferences({ [field]: newValue });
  };

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
          // Se foi negada anteriormente, mostrar mensagem específica
          if (error.message?.includes('negada')) {
            alert('As notificações foram bloqueadas anteriormente. Por favor, ative manualmente nas configurações do navegador:\n\n1. Clique no ícone de cadeado ao lado da URL\n2. Selecione "Notificações"\n3. Altere para "Permitir"\n4. Recarregue a página');
            setIsRegistering(false);
            return;
          }
          throw error;
        }
        
        if (currentPermission !== 'granted') {
          if (currentPermission === 'denied') {
            alert('As notificações foram bloqueadas. Por favor, ative manualmente nas configurações do navegador.');
          } else {
            alert('É necessário permitir notificações para continuar.');
          }
          setPermission(currentPermission);
          setIsRegistering(false);
          return;
        }
        setPermission(currentPermission);
      }

      // Verificar se service worker está ativo
      if (!serviceWorkerActive) {
        alert('O Service Worker não está ativo. Por favor, aguarde alguns segundos e clique em "Verificar e Atualizar" novamente.');
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
      
      // Não mostrar alert, apenas atualizar a UI silenciosamente
      console.log('✅ Notificações ativadas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao registrar subscription:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      if (errorMessage.includes('service worker')) {
        alert('O Service Worker não está ativo. Por favor, aguarde alguns segundos e tente novamente.');
      } else {
        alert(`Erro ao ativar notificações: ${errorMessage}\n\nVerifique se o service worker está ativo e tente novamente.`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes('subscription')) {
          // Não tem subscription registrada
          const shouldRegister = confirm('Você precisa registrar sua subscription primeiro. Deseja registrar agora?');
          if (shouldRegister) {
            await handleRegisterSubscription();
          }
          setIsTesting(false);
          return;
        }
        throw new Error('Erro ao enviar notificação de teste');
      }

      // Mensagem mais informativa
      const isPWAInstalled = support?.pwaInstalled ?? false;
      const message = isPWAInstalled
        ? '✅ Notificação de teste enviada!\n\nVocê deve receber uma notificação do sistema operacional em alguns segundos.\n\n💡 Como o PWA está instalado, você receberá notificações mesmo com o app fechado!'
        : '✅ Notificação de teste enviada!\n\nVocê deve receber uma notificação do sistema operacional em alguns segundos.\n\n⚠️ Para receber notificações com o site fechado, instale o PWA primeiro.';
      
      alert(message);
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      alert('Erro ao enviar notificação de teste. Verifique se as notificações estão ativadas.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestRankingNotification = async () => {
    setIsTestingRanking(true);
    try {
      const response = await fetch('/api/push/test-ranking', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar notificação de ranking de teste');
      }

      alert('✅ Notificação de ranking de teste enviada!\n\nVocê deve receber uma notificação simulando uma mudança no ranking.');
    } catch (error) {
      console.error('Erro ao enviar notificação de ranking de teste:', error);
      alert('Erro ao enviar notificação de ranking de teste. Verifique se as notificações de ranking estão ativadas.');
    } finally {
      setIsTestingRanking(false);
    }
  };

  const handleRefresh = async () => {
    const supportInfo = await checkPushNotificationSupport();
    setSupport(supportInfo);
    const perm = await checkNotificationPermission();
    setPermission(perm);
    
    // Verificar subscription no servidor
    try {
      const response = await fetch('/api/push/subscribe', { method: 'HEAD' });
      setHasSubscription(response.status === 200);
    } catch {
      setHasSubscription(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const serviceWorkerActive = support?.serviceWorkerActive ?? false;
  const isPWA = support?.pwaInstalled ?? false;
  const needsRegistration = permission === 'granted' && serviceWorkerActive && hasSubscription === false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificações
        </CardTitle>
        <CardDescription>
          Gerencie suas preferências de notificações push
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção de Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Permissão do navegador:</span>
              <div className="flex items-center gap-2">
                {permission === 'granted' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Permitido</span>
                  </>
                ) : permission === 'denied' ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400">Bloqueado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-600 dark:text-amber-400">Não solicitado</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service Worker:</span>
              <div className="flex items-center gap-2">
                {serviceWorkerActive ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Ativo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400">Inativo</span>
                  </>
                )}
              </div>
            </div>
            {hasSubscription !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subscription:</span>
                <div className="flex items-center gap-2">
                  {hasSubscription ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">Registrada</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400">Não registrada</span>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rodando como PWA (APP):</span>
              <div className="flex items-center gap-2">
                {isPWA ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Sim</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Não</span>
                  </>
                )}
              </div>
            </div>
            {/* Botão para ativar notificações do zero */}
            {permission !== 'granted' && (
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium mb-2 text-center">
                  {permission === 'denied' 
                    ? '⚠️ Notificações bloqueadas'
                    : '🔔 Ative as notificações'}
                </p>
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  {permission === 'denied'
                    ? 'As notificações foram bloqueadas. Ative manualmente nas configurações do navegador.'
                    : !serviceWorkerActive
                    ? 'Aguarde o Service Worker estar ativo para ativar as notificações. Clique em "Verificar e Atualizar" acima.'
                    : 'Clique no botão abaixo para ativar as notificações e começar a receber alertas importantes.'}
                </p>
                <Button
                  onClick={handleRegisterSubscription}
                  disabled={isRegistering || permission === 'denied' || !serviceWorkerActive}
                  className="w-full"
                  size="lg"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ativando notificações...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      {permission === 'denied' ? 'Ativar nas Configurações' : 'Ativar Notificações'}
                    </>
                  )}
                </Button>
                {permission === 'denied' && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Clique no ícone de cadeado ao lado da URL → Notificações → Permitir
                  </p>
                )}
              </div>
            )}
            
            {/* Botão para registrar subscription quando já tem permissão mas não tem subscription */}
            {needsRegistration && (
              <Button
                onClick={handleRegisterSubscription}
                disabled={isRegistering}
                className="w-full mt-2"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Registrar Subscription
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="w-full mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar e Atualizar
            </Button>
          </div>
        </div>

        {/* Seção de Preferências */}
        {preferences && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Preferências</h3>

            {/* Toggle Geral */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="font-medium">Todas as Notificações</div>
                <div className="text-sm text-muted-foreground">
                  {preferences.allEnabled
                    ? 'Todas as notificações estão ativas. Você receberá alertas sobre ranking, posts populares e atividades de pessoas que você segue.'
                    : 'Todas as notificações estão desativadas. Você não receberá nenhum alerta push, mesmo que os tipos individuais estejam ativados.'}
                </div>
              </div>
              <Switch
                checked={preferences.allEnabled}
                onCheckedChange={() => handleToggle('allEnabled')}
                disabled={isUpdating}
              />
            </div>

            {/* Toggle Ranking */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="font-medium">Notificações de Ranking</div>
                <div className="text-sm text-muted-foreground">
                  {preferences.rankingEnabled && preferences.allEnabled
                    ? 'Você receberá notificações quando: entrar no top 3 do ranking, subir mais de 5 posições ou descer mais de 5 posições. Ajuda você a acompanhar sua performance.'
                    : 'Você não receberá notificações sobre mudanças na sua posição no ranking. Útil se você prefere verificar manualmente sua posição.'}
                </div>
              </div>
              <Switch
                checked={preferences.rankingEnabled && preferences.allEnabled}
                onCheckedChange={() => handleToggle('rankingEnabled')}
                disabled={isUpdating || !preferences.allEnabled}
              />
            </div>

            {/* Toggle Engajamento */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="font-medium">Notificações de Engajamento</div>
                <div className="text-sm text-muted-foreground">
                  {preferences.engagementEnabled && preferences.allEnabled
                    ? 'Você receberá notificações sobre posts que estão ganhando muito engajamento (curtidas, comentários) nas últimas horas. Ajuda a descobrir conteúdo relevante da comunidade.'
                    : 'Você não receberá notificações sobre posts populares. Útil se você prefere explorar o feed manualmente.'}
                </div>
              </div>
              <Switch
                checked={preferences.engagementEnabled && preferences.allEnabled}
                onCheckedChange={() => handleToggle('engagementEnabled')}
                disabled={isUpdating || !preferences.allEnabled}
              />
            </div>

            {/* Toggle Following */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="font-medium">Notificações de Seguidos</div>
                <div className="text-sm text-muted-foreground">
                  {preferences.followingEnabled && preferences.allEnabled
                    ? 'Você receberá notificações sobre alguns posts novos de pessoas que você segue (não todos, para evitar spam). Ajuda a não perder conteúdo de investidores que você acompanha.'
                    : 'Você não receberá notificações sobre novos posts de pessoas que você segue. Útil se você prefere verificar o feed de seguidos manualmente.'}
                </div>
              </div>
              <Switch
                checked={preferences.followingEnabled && preferences.allEnabled}
                onCheckedChange={() => handleToggle('followingEnabled')}
                disabled={isUpdating || !preferences.allEnabled}
              />
            </div>
          </div>
        )}

        {/* Seção de Teste */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-1">Testar Notificações</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Use o botão abaixo para validar se o sistema de notificações está funcionando corretamente. 
              Você receberá uma notificação de teste que aparecerá como uma notificação do sistema operacional.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={handleTestNotification}
              disabled={isTesting || permission !== 'granted' || !serviceWorkerActive || hasSubscription === false}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enviar Notificação de Teste
                </>
              )}
            </Button>
            
            {permission === 'granted' && serviceWorkerActive && hasSubscription && (
              <Button
                onClick={handleTestRankingNotification}
                disabled={isTestingRanking || !preferences?.rankingEnabled || !preferences?.allEnabled}
                className="w-full"
                variant="outline"
              >
                {isTestingRanking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Testar Notificação de Ranking
                  </>
                )}
              </Button>
            )}
          </div>

          {permission !== 'granted' && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Ative as notificações primeiro para poder testar
              </p>
            </div>
          )}
          
          {permission === 'granted' && serviceWorkerActive && hasSubscription === false && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Você precisa registrar sua subscription para receber notificações. Clique em &quot;Registrar Subscription&quot; acima.
              </p>
            </div>
          )}

          {/* {permission === 'granted' && serviceWorkerActive && hasSubscription && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-2">
                💡 Como testar com o app fechado:
              </p>
              <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Instale o PWA primeiro (banner no topo da página)</li>
                <li>Feche completamente o navegador</li>
                <li>Envie uma notificação de teste</li>
                <li>Você receberá a notificação mesmo com tudo fechado!</li>
              </ol>
            </div>
          )} */}
        </div>

        {/* Seção de Informações */}
        <div className="space-y-2 p-3 rounded-lg bg-muted/50">
          <h3 className="text-sm font-semibold">Informações</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Máximo de 1 notificação por hora</li>
            <li>• Notificações funcionam mesmo com o app fechado (se PWA instalado)</li>
            <li>• Você pode desativar notificações a qualquer momento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
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

