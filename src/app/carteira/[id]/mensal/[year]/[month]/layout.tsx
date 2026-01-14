import { Metadata } from 'next';
import { prisma } from '@/lib/prisma/client';
import { rankingService } from '@/lib/services/ranking-service';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { id: string; year: string; month: string };
}): Promise<Metadata> {
  const userId = params.id;
  const year = parseInt(params.year, 10);
  const month = parseInt(params.month, 10);
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const monthName = monthNames[month - 1] || '';
  
  // Buscar dados do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, slug: true },
  });
  
  if (!user) {
    return {
      title: 'Carteira não encontrada',
    };
  }
  
  // Buscar dados do ranking para este período
  let competitorData: any = null;
  try {
    const ranking = await rankingService.getRanking('mensal', year, month);
    if (ranking) {
      competitorData = ranking.ranking.find((entry: any) => entry.userId === userId);
    }
  } catch (error) {
    // Ignorar erros
  }
  
  const rentabilityText = competitorData?.monthlyReturn 
    ? ` - Rentabilidade ${competitorData.monthlyReturn > 0 ? '+' : ''}${competitorData.monthlyReturn.toFixed(2)}%`
    : '';
  const rankText = competitorData?.rank ? ` - Posição #${competitorData.rank}` : '';
  
  const title = `Carteira de ${user.name} - ${monthName}/${year}${rentabilityText}${rankText}`;
  const description = `Carteira de investimentos de ${user.name} em ${monthName}/${year}. ${competitorData?.monthlyReturn ? `Rentabilidade de ${competitorData.monthlyReturn > 0 ? '+' : ''}${competitorData.monthlyReturn.toFixed(2)}%. ` : ''}${competitorData?.rank ? `Posição #${competitorData.rank} no ranking mensal. ` : ''}Veja composição da carteira, alocação de ativos e histórico de transações.`;
  
  const profileUrl = user.slug 
    ? `${baseUrl}/perfil/${user.slug}`
    : `${baseUrl}/perfil/${userId}`;
  const portfolioUrl = `${baseUrl}/carteira/${userId}/mensal/${year}/${month.toString().padStart(2, '0')}`;
  
  return {
    title,
    description,
    keywords: [
      `carteira ${user.name}`,
      "carteira de investimentos",
      "composição de carteira",
      "alocação de ativos",
      "histórico de transações",
      `carteira ${monthName} ${year}`,
      "estratégia de investimento",
    ],
    openGraph: {
      title,
      description,
      url: portfolioUrl,
      type: "website",
      siteName: "Hold Arena",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: portfolioUrl,
    },
  };
}

export default function PortfolioMensalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

