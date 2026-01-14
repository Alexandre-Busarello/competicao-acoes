import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { findUserBySlugOrId } from '@/lib/utils/user-slug-generator';
import { updateUserSlug } from '@/lib/utils/user-slug-generator';
import { PublicProfilePageClient } from './PublicProfilePageClient';
import { prisma } from '@/lib/prisma/client';
import { medalService } from '@/lib/services/medal-service';
import { rankingService } from '@/lib/services/ranking-service';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}): Promise<Metadata> {
  const user = await findUserBySlugOrId(params.userId);
  
  if (!user) {
    return {
      title: 'Perfil não encontrado',
    };
  }

  // Buscar medalhas do usuário
  const medals = await medalService.getUserMedals(user.id);
  const totalMedals = medals.total.total;
  
  // Buscar rankings atuais
  const currentPeriod = getCurrentPeriod();
  let monthlyRank: number | null = null;
  let annualRank: number | null = null;
  
  try {
    const monthlyRanking = await rankingService.getRanking('mensal', currentPeriod.year, currentPeriod.month);
    if (monthlyRanking) {
      const userEntry = monthlyRanking.ranking.find((entry: any) => entry.userId === user.id);
      if (userEntry) {
        monthlyRank = userEntry.rank;
      }
    }
    
    const annualRanking = await rankingService.getRanking('anual', currentPeriod.year);
    if (annualRanking) {
      const userEntry = annualRanking.ranking.find((entry: any) => entry.userId === user.id);
      if (userEntry) {
        annualRank = userEntry.rank;
      }
    }
  } catch (error) {
    // Ignorar erros de ranking
  }

  const medalText = totalMedals > 0 ? ` - ${totalMedals} medalha${totalMedals > 1 ? 's' : ''}` : '';
  const rankText = monthlyRank ? ` - #${monthlyRank} no ranking mensal` : '';
  
  const title = `${user.name} - Perfil de Investidor${medalText}${rankText}`;
  const description = `Perfil público de ${user.name} na Hold Arena. ${totalMedals > 0 ? `${totalMedals} medalha${totalMedals > 1 ? 's' : ''} conquistada${totalMedals > 1 ? 's' : ''}. ` : ''}${monthlyRank ? `Posição #${monthlyRank} no ranking mensal. ` : ''}Veja estratégias de investimento, carteira pública e histórico de decisões.`;

  const profileUrl = user.slug 
    ? `${baseUrl}/perfil/${user.slug}`
    : `${baseUrl}/perfil/${user.id}`;

  return {
    title,
    description,
    keywords: [
      `perfil ${user.name}`,
      "perfil de investidor",
      "carteira pública",
      "estratégias de investimento",
      "ranking de investidores",
      totalMedals > 0 ? "investidor premiado" : "",
      monthlyRank ? `top ${monthlyRank} investidores` : "",
    ].filter(Boolean),
    authors: [{ name: user.name }],
    openGraph: {
      title,
      description,
      url: profileUrl,
      type: "profile",
      siteName: "Hold Arena",
      images: user.avatarUrl
        ? [
            {
              url: user.avatarUrl,
              width: 400,
              height: 400,
              alt: user.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
    alternates: {
      canonical: profileUrl,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  // Buscar usuário por slug ou ID
  const user = await findUserBySlugOrId(params.userId);
  
  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <p className="text-muted-foreground text-center">Perfil não encontrado</p>
        </div>
      </div>
    );
  }

  // Verificar se acessou pelo ID (UUID) ou pelo slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);
  
  if (isUUID && params.userId === user.id) {
    // Acessou pelo ID
    if (!user.slug) {
      // Não tem slug - gerar slug e redirecionar
      try {
        const slug = await updateUserSlug(user.id);
        redirect(`/perfil/${slug}`);
      } catch (error) {
        console.error('Error generating slug:', error);
        // Continuar sem slug se houver erro
      }
    } else {
      // Tem slug - redirecionar para slug
      redirect(`/perfil/${user.slug}`);
    }
  }
  // Se acessou pelo slug, continuar normalmente (não redirecionar)

  // Passar userId real para o componente client
  return <PublicProfilePageClient userId={user.id} />;
}
