/**
 * Utilitário para gerenciar seed do feed global
 * O seed muda apenas quando o usuário cria posts (não quando interage)
 * Quando o seed muda, apenas atualiza para próximas requisições sem invalidar o feed atual
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
 * Apenas atualiza o seed para próximas requisições, sem invalidar o feed atual
 * O feed atual continua mostrando os posts já carregados
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

