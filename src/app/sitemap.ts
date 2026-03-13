import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidar a cada hora

// Função auxiliar para validar e sanitizar URLs
function validateUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Garantir que a URL é válida e usa HTTPS ou HTTP
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    // Retornar URL codificada corretamente
    return urlObj.toString();
  } catch {
    return null;
  }
}

// Função auxiliar para validar e sanitizar slugs
function sanitizeSlug(slug: string | null | undefined): string | null {
  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    return null;
  }
  // Remover caracteres inválidos e espaços
  return slug.trim();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Garantir que baseUrl termina sem barra
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // URLs estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: cleanBaseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${cleanBaseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${cleanBaseUrl}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${cleanBaseUrl}/ranking-ggb`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${cleanBaseUrl}/ranking-fii`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${cleanBaseUrl}/como-funciona`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${cleanBaseUrl}/rede-social-investidor`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  let profileRoutes: MetadataRoute.Sitemap = [];

  try {
    // Função para calcular score de engajamento (mesma fórmula do GlobalFeedService)
    const calculateEngagementScore = (likeCount: number, commentCount: number): number => {
      return likeCount * 2 + commentCount * 3;
    };

    // Buscar apenas posts MANUAIS (custom) públicos com informações de engajamento
    // Excluir posts automáticos de transações (type: 'transaction')
    const posts = await prisma.feedPost.findMany({
      where: {
        isPublic: true,
        deletedAt: null,
        type: 'custom', // Apenas posts manuais criados pelos usuários
      },
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
        likeCount: true,
        commentCount: true,
      },
      // Buscar mais posts para filtrar por engajamento depois
      take: 5000,
    });

    // Calcular score de engajamento e ordenar por ele (maior primeiro)
    const postsWithEngagement = posts
      .map((post) => ({
        ...post,
        engagementScore: calculateEngagementScore(post.likeCount, post.commentCount),
      }))
      .sort((a, b) => {
        // Ordenar por engajamento (maior primeiro)
        // Se empate, usar data mais recente
        if (b.engagementScore !== a.engagementScore) {
          return b.engagementScore - a.engagementScore;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      // Limitar a 2000 posts de maior qualidade
      .slice(0, 2000);

    // Gerar URLs dos posts com priority baseada no engajamento
    const postRoutesArray: Array<MetadataRoute.Sitemap[0] | null> = postsWithEngagement.map((post) => {
      const slug = sanitizeSlug(post.slug);
      if (!slug) {
        return null;
      }

      // Priority varia de 0.8 a 1.0 baseado no engajamento
      // Posts com engajamento muito alto (>50) têm priority 1.0
      // Posts com engajamento médio (10-50) têm priority 0.9
      // Posts com engajamento baixo (<10) têm priority 0.8
      let priority = 0.8;
      if (post.engagementScore >= 50) {
        priority = 1.0;
      } else if (post.engagementScore >= 10) {
        priority = 0.9;
      }

      const url = `${cleanBaseUrl}/posts/${encodeURIComponent(slug)}`;
      const validatedUrl = validateUrl(url);
      
      if (!validatedUrl) {
        return null;
      }

      // Garantir que lastModified é uma data válida
      const lastModified = post.updatedAt || post.createdAt;
      if (!lastModified || !(lastModified instanceof Date)) {
        return null;
      }

      return {
        url: validatedUrl,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: Math.max(0, Math.min(1, priority)), // Garantir que priority está entre 0 e 1
      };
    });
    
    postRoutes = postRoutesArray.filter((route): route is MetadataRoute.Sitemap[0] => route !== null);

  } catch (error) {
    console.error('Error generating post routes in sitemap:', error);
    // Continuar mesmo se houver erro nos posts
  }

  try {
    // Buscar TOP 100 perfis com mais medalhas
    // Agrupar medalhas por usuário e ordenar por total de medalhas
    const topUsers = await prisma.user.findMany({
      where: {
        // Apenas usuários com medalhas e posts públicos
        medals: {
          some: {},
        },
        feedPosts: {
          some: {
            isPublic: true,
            deletedAt: null,
          },
        },
      },
      include: {
        medals: {
          select: {
            id: true,
          },
        },
      },
      take: 1000, // Buscar mais para calcular medalhas
    });

    // Calcular total de medalhas e ordenar
    const usersWithMedalCount = topUsers
      .map((user) => ({
        id: user.id,
        slug: (user as any).slug || null,
        updatedAt: user.updatedAt,
        medalCount: user.medals.length,
      }))
      .sort((a, b) => b.medalCount - a.medalCount) // Ordenar por quantidade de medalhas (maior primeiro)
      .slice(0, 100); // TOP 100 apenas

    // Gerar URLs dos perfis usando slug (ou ID como fallback)
    const profileRoutesArray: Array<MetadataRoute.Sitemap[0] | null> = usersWithMedalCount.map((user) => {
      // Priority baseada em quantidade de medalhas
      // TOP com muitas medalhas: 0.9, médio: 0.8, resto: 0.7
      let priority = 0.7;
      if (user.medalCount >= 20) {
        priority = 0.9;
      } else if (user.medalCount >= 10) {
        priority = 0.8;
      }

      // Usar slug se disponível, senão usar ID
      const slug = sanitizeSlug(user.slug);
      const url = slug 
        ? `${cleanBaseUrl}/perfil/${encodeURIComponent(slug)}`
        : `${cleanBaseUrl}/perfil/${encodeURIComponent(user.id)}`;

      const validatedUrl = validateUrl(url);
      
      if (!validatedUrl) {
        return null;
      }

      // Garantir que lastModified é uma data válida
      if (!user.updatedAt || !(user.updatedAt instanceof Date)) {
        return null;
      }

      return {
        url: validatedUrl,
        lastModified: user.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: Math.max(0, Math.min(1, priority)), // Garantir que priority está entre 0 e 1
      };
    });
    
    profileRoutes = profileRoutesArray.filter((route): route is MetadataRoute.Sitemap[0] => route !== null);

  } catch (error) {
    console.error('Error generating profile routes in sitemap:', error);
    // Continuar mesmo se houver erro nos perfis
  }

  // Combinar todas as rotas e garantir que não ultrapassamos o limite do Google (50.000 URLs)
  const allRoutes = [...staticRoutes, ...postRoutes, ...profileRoutes];
  const maxUrls = 50000;
  
  if (allRoutes.length > maxUrls) {
    console.warn(`Sitemap has ${allRoutes.length} URLs, limiting to ${maxUrls}`);
    return allRoutes.slice(0, maxUrls);
  }

  return allRoutes;
}

