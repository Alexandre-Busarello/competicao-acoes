'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

export function InstallPrompt() {
  // Usar ref para armazenar o prompt sem causar re-renderizações
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Garantir que só executa no cliente - não bloqueante
  useEffect(() => {
    setIsClient(true);
  }, []);

  // useEffect principal - executado apenas uma vez, não bloqueante
  useEffect(() => {
    // Não executar nada se não estiver no cliente
    if (typeof window === 'undefined' || !isClient) {
      return;
    }

    // Verificar se já está instalado de forma assíncrona e não bloqueante
    const checkStandalone = (): boolean => {
      try {
        const standalone = 
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true ||
          document.referrer.includes('android-app://');
        
        if (standalone) {
          setIsInstalled(true);
          setShowPrompt(false);
          console.log('🔵 App já está instalado (standalone mode)');
          return true;
        }
        return false;
      } catch (error) {
        // Em caso de erro, não bloquear a aplicação
        console.warn('Erro ao verificar standalone mode:', error);
        return false;
      }
    };

    // Verificar standalone de forma assíncrona usando requestIdleCallback ou setTimeout
    const checkStandaloneAsync = () => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
          checkStandalone();
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          checkStandalone();
        }, 0);
      }
    };

    // Verificar standalone imediatamente de forma não bloqueante
    checkStandaloneAsync();

    // Verificar se o usuário já dispensou o banner de forma assíncrona
    // TTL de 1 hora (3600000ms)
    const checkDismissedAsync = () => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
          try {
            const dismissed = localStorage.getItem(DISMISSED_KEY);
            if (dismissed) {
              const dismissedTime = parseInt(dismissed, 10);
              const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
              if (hoursSinceDismiss < 1) {
                console.log('🔵 Banner foi dispensado recentemente (TTL: 1 hora)');
                setShowPrompt(false);
                return;
              }
            }
          } catch (error) {
            console.warn('Erro ao verificar dismissed:', error);
          }
        }, { timeout: 500 });
      } else {
        setTimeout(() => {
          try {
            const dismissed = localStorage.getItem(DISMISSED_KEY);
            if (dismissed) {
              const dismissedTime = parseInt(dismissed, 10);
              const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
              if (hoursSinceDismiss < 1) {
                console.log('🔵 Banner foi dispensado recentemente (TTL: 1 hora)');
                setShowPrompt(false);
                return;
              }
            }
          } catch (error) {
            console.warn('Erro ao verificar dismissed:', error);
          }
        }, 0);
      }
    };

    checkDismissedAsync();

    console.log('🔍 Aguardando evento beforeinstallprompt...');

    // Handler para o evento beforeinstallprompt (Chrome, Edge, etc.)
    // IMPORTANTE: Este evento só dispara quando o PWA pode ser instalado E ainda não está instalado
    // Se o Chrome mostra "Abrir no app", o evento não será disparado porque já está instalado
    const handler = (e: Event) => {
      console.log('✅ Evento beforeinstallprompt recebido!');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
    };

    // Adicionar listener de forma não bloqueante
    window.addEventListener('beforeinstallprompt', handler);

    // Verificar se o evento não foi disparado após alguns segundos (não bloqueante)
    const checkEventTimer = setTimeout(() => {
      if (!deferredPromptRef.current) {
        console.log('Verificando requisitos do PWA:');
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasManifest = !!document.querySelector('link[rel="manifest"]');
        
        if (hasServiceWorker) {
          // Verificação assíncrona não bloqueante
          navigator.serviceWorker.getRegistrations().then(registrations => {
            const hasActiveSW = registrations.length > 0 && registrations.some(reg => reg.active);
            
            console.log('- Service Worker:', hasServiceWorker ? '✅' : '❌');
            console.log('- Manifest:', hasManifest ? '✅' : '❌');
            console.log('- Service Worker Ativo:', hasActiveSW ? '✅' : '❌');
            
            // Se todos os requisitos estão atendidos mas o evento não disparou,
            // provavelmente o app já está instalado (Chrome mostra "Abrir no app")
            if (hasServiceWorker && hasManifest && hasActiveSW && !deferredPromptRef.current) {
              console.log('🔵 Evento beforeinstallprompt não disparado - App provavelmente já está instalado');
              console.log('💡 Se o Chrome mostra "Abrir no app", o PWA já está instalado');
            }
          }).catch(error => {
            console.warn('Erro ao verificar service worker:', error);
          });
        }
      }
    }, 8000);

    // Verificar periodicamente se está instalado (a cada 2 segundos) - não bloqueante
    const checkInstalledInterval = setInterval(() => {
      try {
        if (checkStandalone()) {
          setShowPrompt(false);
          deferredPromptRef.current = null;
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.warn('Erro ao verificar instalado periodicamente:', error);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(checkEventTimer);
      clearInterval(checkInstalledInterval);
    };
  }, [isClient]); // Removido deferredPrompt das dependências

  const handleInstall = async () => {
    // Usar a ref para garantir que temos o prompt mais recente
    const prompt = deferredPromptRef.current || deferredPrompt;
    
    // Se temos o prompt nativo, usar ele
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;

        if (outcome === 'accepted') {
          setShowPrompt(false);
          setIsInstalled(true);
          
          // Marcar PWA como instalado no servidor
          try {
            await fetch('/api/user/pwa-installed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (error) {
            console.error('Erro ao marcar PWA como instalado:', error);
          }
          
          // Após instalar o PWA, solicitar permissão de notificações automaticamente
          setTimeout(async () => {
            try {
              await requestNotificationsAfterInstall();
            } catch (error) {
              console.warn('Erro ao solicitar notificações após instalação:', error);
            }
          }, 1000); // Aguardar 1 segundo para garantir que o PWA foi instalado
        } else {
          deferredPromptRef.current = null;
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.error('Erro ao instalar PWA:', error);
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
      }
      return;
    }
  };

  // Função para solicitar notificações após instalação do PWA
  const requestNotificationsAfterInstall = async () => {
    // Verificar se já tem permissão
    if (!('Notification' in window)) {
      return; // Não suporta notificações
    }

    // Verificar se o usuário está autenticado antes de solicitar notificações
    // Fazemos uma verificação simples verificando se há token de sessão
    try {
      const authCheck = await fetch('/api/auth/me');
      if (!authCheck.ok) {
        // Usuário não autenticado, não solicitar notificações ainda
        return;
      }
    } catch {
      // Se não conseguir verificar, não solicitar notificações
      return;
    }

    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
      // Já tem permissão, apenas registrar subscription
      await registerPushSubscription();
      return;
    }

    if (currentPermission === 'denied') {
      // Permissão negada, não fazer nada
      return;
    }

    // Solicitar permissão após um pequeno delay para melhor UX
    setTimeout(async () => {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Registrar subscription automaticamente
          await registerPushSubscription();
        }
      } catch (error) {
        console.error('Erro ao solicitar permissão de notificações:', error);
      }
    }, 2000); // Aguardar 2 segundos após instalação
  };

  // Função para registrar push subscription
  const registerPushSubscription = async () => {
    try {
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
      await fetch('/api/push/subscribe', {
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
    } catch (error) {
      console.error('Erro ao registrar subscription:', error);
    }
  };

  // Utilitários para conversão de chaves VAPID
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
    // Salvar no localStorage que foi dispensado de forma não bloqueante
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Erro ao salvar dismissed:', error);
    }
  };

  // Não renderizar nada durante SSR ou se não estiver no cliente
  // Isso não bloqueia a renderização do resto da aplicação
  if (!isClient) {
    return null;
  }

  // IMPORTANTE: Só mostrar o banner se o evento beforeinstallprompt foi disparado
  // Se o evento não foi disparado, significa que o app já está instalado
  // (mesmo que o Chrome mostre "Abrir no app" em vez de "Instalar")
  // Verificação não bloqueante - não acessa window durante renderização
  if (!showPrompt || !deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/95 to-primary backdrop-blur-sm border-b border-primary/20 shadow-lg">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Download className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-primary-foreground">
              <span className="hidden sm:inline">Instale o app para uma experiência melhor e acesso rápido</span>
              <span className="sm:hidden">Instale o app para melhor experiência</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 h-8 px-2 sm:px-3 text-xs sm:text-sm"
              onClick={handleInstall}
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              Instalar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleDismiss}
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

