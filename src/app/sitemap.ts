import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidar a cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // URLs estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/como-funciona`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rede-social-investidor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

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
    const postRoutes: MetadataRoute.Sitemap = postsWithEngagement.map((post) => {
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

      return {
        url: `${baseUrl}/posts/${post.slug}`,
        lastModified: post.updatedAt || post.createdAt,
        changeFrequency: 'weekly' as const,
        priority,
      };
    });

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
    const profileRoutes: MetadataRoute.Sitemap = usersWithMedalCount.map((user) => {
      // Priority baseada em quantidade de medalhas
      // TOP com muitas medalhas: 0.9, médio: 0.8, resto: 0.7
      let priority = 0.7;
      if (user.medalCount >= 20) {
        priority = 0.9;
      } else if (user.medalCount >= 10) {
        priority = 0.8;
      }

      // Usar slug se disponível, senão usar ID
      const url = user.slug 
        ? `${baseUrl}/perfil/${user.slug}`
        : `${baseUrl}/perfil/${user.id}`;

      return {
        url,
        lastModified: user.updatedAt,
        changeFrequency: 'weekly' as const,
        priority,
      };
    });

    return [...staticRoutes, ...postRoutes, ...profileRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Retornar apenas rotas estáticas em caso de erro
    return staticRoutes;
  }
}

