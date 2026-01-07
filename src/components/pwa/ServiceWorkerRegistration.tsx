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
        // Verificar se o service worker já está registrado
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        if (existingRegistrations.length > 0) {
          console.log('Service Worker já registrado:', existingRegistrations[0].scope);
          return;
        }

        // Tentar registrar o service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.log('✅ Service Worker registrado com sucesso:', registration.scope);
        console.log('Service Worker ativo:', registration.active?.scriptURL);

        // Verificar se há uma atualização disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nova versão do Service Worker disponível');
              }
            });
          }
        });

        // Verificar atualizações periodicamente
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // A cada hora
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

