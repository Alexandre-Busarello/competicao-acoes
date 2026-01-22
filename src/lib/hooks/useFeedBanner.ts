import { useQuery } from '@tanstack/react-query';

interface Banner {
  id: string;
  variation: string;
  title: string;
  description: string;
  benefit: string;
  ctaText: string;
  priority: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface UseFeedBannerResult {
  banners: Banner[];
  isLoading: boolean;
  getBannerForPosition: (position: number) => Banner | null;
  getBannerByIndex: (index: number, prioritizeFirst?: boolean) => Banner | null;
}

/**
 * Hook para buscar banners e selecionar banner baseado na posição no feed
 * Mostra banner antes do primeiro post (posição 0) e depois a cada 4 posts
 * Rotaciona banners usando round-robin
 */
export function useFeedBanner(): UseFeedBannerResult {
  const { data, isLoading } = useQuery<{ banners: Banner[] }>({
    queryKey: ['feed-banners'],
    queryFn: async () => {
      const response = await fetch('/api/feed/banners');
      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const banners = data?.banners || [];

  /**
   * Retorna o banner apropriado para uma posição no feed
   * Posição 0: antes do primeiro post (sempre o banner de maior prioridade)
   * Posições 4, 8, 12, etc.: a cada 4 posts
   * Rotação respeita a priorização: sempre começa do banner de maior prioridade
   */
  const getBannerForPosition = (position: number): Banner | null => {
    if (banners.length === 0) {
      return null;
    }

    // Posição 0: sempre o banner de maior prioridade (banners[0])
    if (position === 0) {
      return banners[0] || null;
    }

    // A cada 4 posts (posições 4, 8, 12, etc.), mostrar um banner
    if (position % 4 !== 0) {
      return null;
    }

    // Se houver apenas um banner, retornar ele
    if (banners.length === 1) {
      return banners[0];
    }

    // Rotação que respeita prioridade:
    // - Posição 4: banners[0] (maior prioridade)
    // - Posição 8: banners[1] (segunda maior prioridade)
    // - Posição 12: banners[2] (terceira maior prioridade)
    // - Quando acabar, volta para o primeiro
    // -1 porque posição 0 já foi tratada acima
    const rotationIndex = Math.floor(position / 4) - 1;
    const bannerIndex = rotationIndex % banners.length;
    return banners[bannerIndex] || banners[0];
  };

  /**
   * Retorna banner por índice (para rotação simples)
   * Útil para páginas de post onde queremos rotacionar banners
   * @param index - Índice da rotação
   * @param prioritizeFirst - Se true, sempre retorna banners[0] quando index === 0
   */
  const getBannerByIndex = (index: number, prioritizeFirst: boolean = false): Banner | null => {
    if (banners.length === 0) {
      return null;
    }

    // Se prioritizeFirst e index === 0, sempre retornar o banner de maior prioridade
    if (prioritizeFirst && index === 0) {
      return banners[0];
    }

    const bannerIndex = index % banners.length;
    return banners[bannerIndex] || null;
  };

  return {
    banners,
    isLoading,
    getBannerForPosition,
    getBannerByIndex,
  };
}

