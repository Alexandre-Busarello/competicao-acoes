'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Workers não são suportados neste navegador');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Sempre tentar registrar/atualizar o service worker
        // Isso garante que atualizações sejam aplicadas automaticamente
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Sempre buscar versão mais recente
        });

        console.log('✅ Service Worker registrado/atualizado:', registration.scope);
        console.log('Service Worker ativo:', registration.active?.scriptURL);

        // Se há um novo service worker instalando, aguardar ativação
        if (registration.installing) {
          registration.installing.addEventListener('statechange', function() {
            if (this.state === 'activated') {
              console.log('✅ Service Worker ativado com handlers de push');
              // Recarregar página para usar o novo service worker (opcional)
              // window.location.reload();
            }
          });
        } else if (registration.waiting) {
          // Se há um service worker esperando, ativar imediatamente
          console.log('🔄 Service Worker aguardando, ativando...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else if (registration.active) {
          console.log('✅ Service Worker já está ativo');
        }

        // Verificar se há uma atualização disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('🔄 Nova versão do Service Worker disponível, ativando...');
                  // Ativar imediatamente
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                } else {
                  console.log('✅ Service Worker instalado pela primeira vez');
                }
              } else if (newWorker.state === 'activated') {
                console.log('✅ Novo Service Worker ativado');
              }
            });
          }
        });

        // Verificar atualizações periodicamente (a cada 5 minutos)
        setInterval(() => {
          registration.update().catch(err => {
            console.warn('Erro ao verificar atualização do service worker:', err);
          });
        }, 5 * 60 * 1000); // A cada 5 minutos
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
        console.error('Detalhes:', {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    };

    // Registrar quando a página carregar
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
    }

    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
}

