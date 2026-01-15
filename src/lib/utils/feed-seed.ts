/**
 * Utilitário para gerenciar seed do feed global
 * O seed muda quando o usuário cria posts ou interage com posts
 * para garantir que o feed seja reorganizado após essas ações
 */

const STORAGE_KEY = 'feed-session-seed';

/**
 * Gera um novo seed único
 */
export function generateNewSeed(): string {
  return Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Obtém o seed atual do sessionStorage
 * Se não existir, cria um novo
 */
export function getCurrentSeed(): string {
  if (typeof window === 'undefined') {
    return generateNewSeed();
  }

  let seed = sessionStorage.getItem(STORAGE_KEY);
  if (!seed) {
    seed = generateNewSeed();
    sessionStorage.setItem(STORAGE_KEY, seed);
  }
  return seed;
}

/**
 * Atualiza o seed do feed global
 * Isso força uma reorganização do feed quando o usuário cria posts ou interage
 * 
 * @returns O novo seed gerado
 */
export function updateFeedSeed(): string {
  if (typeof window === 'undefined') {
    return generateNewSeed();
  }

  const newSeed = generateNewSeed();
  sessionStorage.setItem(STORAGE_KEY, newSeed);
  
  // Disparar evento customizado para notificar componentes que o seed mudou
  window.dispatchEvent(new CustomEvent('feed-seed-updated', { detail: { seed: newSeed } }));
  
  return newSeed;
}

/**
 * Escuta mudanças no seed do feed
 * Útil para componentes que precisam reagir quando o seed muda
 */
export function onFeedSeedUpdate(callback: (seed: string) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ seed: string }>;
    callback(customEvent.detail.seed);
  };

  window.addEventListener('feed-seed-updated', handler);
  
  return () => {
    window.removeEventListener('feed-seed-updated', handler);
  };
}

