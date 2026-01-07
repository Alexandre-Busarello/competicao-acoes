'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Garantir que só executa no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Não executar nada se não estiver no cliente
    if (typeof window === 'undefined') {
      return;
    }
    // Verificar se já está instalado
    const checkStandalone = () => {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(standalone);
      setIsInstalled(standalone);
      
      if (standalone) {
        console.log('🔵 App já está instalado (standalone mode)');
        setShowPrompt(false);
        setCanInstall(false);
      }
      
      return standalone;
    };

    // Verificar imediatamente
    if (checkStandalone()) {
      return;
    }

    // Verificar se o usuário já dispensou o banner
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Mostrar novamente após 7 dias
      if (daysSinceDismiss < 7) {
        console.log('🔵 Banner foi dispensado recentemente');
        return;
      }
    }

    console.log('🔍 Aguardando evento beforeinstallprompt...');

    // Handler para o evento beforeinstallprompt (Chrome, Edge, etc.)
    // IMPORTANTE: Este evento só dispara quando o PWA pode ser instalado E ainda não está instalado
    // Se o Chrome mostra "Abrir no app", o evento não será disparado porque já está instalado
    const handler = (e: Event) => {
      console.log('✅ Evento beforeinstallprompt recebido!');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Verificar se o evento não foi disparado após alguns segundos
    // Se não foi disparado, pode significar que o app já está instalado
    const checkEventTimer = setTimeout(() => {
      if (!deferredPrompt) {
        console.log('Verificando requisitos do PWA:');
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasManifest = !!document.querySelector('link[rel="manifest"]');
        
        let hasActiveSW = false;
        if (hasServiceWorker) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            hasActiveSW = registrations.length > 0 && registrations.some(reg => reg.active);
            
            console.log('- Service Worker:', hasServiceWorker ? '✅' : '❌');
            console.log('- Manifest:', hasManifest ? '✅' : '❌');
            console.log('- Service Worker Ativo:', hasActiveSW ? '✅' : '❌');
            
            // Se todos os requisitos estão atendidos mas o evento não disparou,
            // provavelmente o app já está instalado (Chrome mostra "Abrir no app")
            if (hasServiceWorker && hasManifest && hasActiveSW && !deferredPrompt) {
              console.log('🔵 Evento beforeinstallprompt não disparado - App provavelmente já está instalado');
              console.log('💡 Se o Chrome mostra "Abrir no app", o PWA já está instalado');
            }
          });
        }
      }
    }, 8000);

    // Verificar periodicamente se está instalado (a cada 2 segundos)
    const checkInstalledInterval = setInterval(() => {
      if (checkStandalone()) {
        setShowPrompt(false);
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    }, 2000);

    // Verificar novamente se está instalado após um delay inicial
    const checkInstalled = setTimeout(() => {
      if (checkStandalone()) {
        setShowPrompt(false);
        setCanInstall(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(checkEventTimer);
      clearTimeout(checkInstalled);
      clearInterval(checkInstalledInterval);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    // Se temos o prompt nativo, usar ele
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setShowPrompt(false);
          setIsInstalled(true);
        } else {
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.error('Erro ao instalar PWA:', error);
        setDeferredPrompt(null);
      }
      return;
    }

    // Se não temos o prompt nativo mas todos os requisitos estão atendidos,
    // tentar abrir o diálogo de instalação do Chrome manualmente
    // Isso funciona em alguns navegadores quando o PWA está pronto
    if (canInstall) {
      // Verificar se o Chrome mostra o botão de instalação na barra de endereços
      // Se sim, instruir o usuário a clicar nele
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      
      if (isChrome) {
        // Tentar abrir o menu de instalação do Chrome
        // Nota: Não há API direta para isso, mas podemos instruir o usuário
        alert(
          'Para instalar o app:\n\n' +
          '1. Procure pelo ícone de instalação (➕) na barra de endereços\n' +
          '2. Ou clique no menu (⋮) → "Instalar Ranking Investimentos"\n\n' +
          'Se o ícone não aparecer, aguarde alguns segundos ou recarregue a página.'
        );
      } else {
        alert(
          'Para instalar o app, procure pela opção de instalação no menu do navegador.'
        );
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    // Salvar no localStorage que foi dispensado
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  // Não renderizar nada durante SSR ou se não estiver no cliente
  if (!isClient) {
    return null;
  }

  // Verificar novamente antes de renderizar (última verificação)
  // Só verificar se estiver no cliente
  const isCurrentlyInstalled = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  // IMPORTANTE: Só mostrar o banner se o evento beforeinstallprompt foi disparado
  // Se o evento não foi disparado, significa que o app já está instalado
  // (mesmo que o Chrome mostre "Abrir no app" em vez de "Instalar")
  if (!showPrompt || !deferredPrompt || isInstalled || isCurrentlyInstalled) {
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

