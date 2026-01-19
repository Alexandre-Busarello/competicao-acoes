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
}

/**
 * Hook para buscar banners e selecionar banner baseado na posição no feed
 * A cada 4 posts, retorna um banner (priorizado por conversões/cliques)
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
   * A cada 4 posts (posições 4, 8, 12, etc.), retorna um banner
   * Usa round-robin entre os banners disponíveis, priorizando por prioridade
   */
  const getBannerForPosition = (position: number): Banner | null => {
    // A cada 4 posts, mostrar um banner
    if (position % 4 !== 0 || banners.length === 0) {
      return null;
    }

    // Se houver apenas um banner, retornar ele
    if (banners.length === 1) {
      return banners[0];
    }

    // Calcular índice usando round-robin baseado na posição
    // Mas sempre priorizar o banner com maior prioridade primeiro
    const bannerIndex = Math.floor((position / 4 - 1) % banners.length);
    return banners[bannerIndex] || banners[0];
  };

  return {
    banners,
    isLoading,
    getBannerForPosition,
  };
}

