import { Metadata } from 'next';
import { prisma } from '@/lib/prisma/client';
import { rankingService } from '@/lib/services/ranking-service';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { id: string; year: string };
}): Promise<Metadata> {
  const userId = params.id;
  const year = parseInt(params.year, 10);
  
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
    const ranking = await rankingService.getRanking('anual', year);
    if (ranking) {
      competitorData = ranking.ranking.find((entry: any) => entry.userId === userId);
    }
  } catch (error) {
    // Ignorar erros
  }
  
  const rentabilityText = competitorData?.annualReturn 
    ? ` - Rentabilidade ${competitorData.annualReturn > 0 ? '+' : ''}${competitorData.annualReturn.toFixed(2)}%`
    : '';
  const rankText = competitorData?.rank ? ` - Posição #${competitorData.rank}` : '';
  
  const title = `Carteira de ${user.name} - ${year}${rentabilityText}${rankText}`;
  const description = `Carteira de investimentos de ${user.name} em ${year}. ${competitorData?.annualReturn ? `Rentabilidade anual de ${competitorData.annualReturn > 0 ? '+' : ''}${competitorData.annualReturn.toFixed(2)}%. ` : ''}${competitorData?.rank ? `Posição #${competitorData.rank} no ranking anual. ` : ''}Veja composição da carteira, alocação de ativos e histórico de transações do ano.`;
  
  const profileUrl = user.slug 
    ? `${baseUrl}/perfil/${user.slug}`
    : `${baseUrl}/perfil/${user.id}`;
  const portfolioUrl = `${baseUrl}/carteira/${userId}/anual/${year}`;
  
  return {
    title,
    description,
    keywords: [
      `carteira ${user.name}`,
      "carteira de investimentos",
      "composição de carteira",
      "alocação de ativos",
      "histórico de transações",
      `carteira ${year}`,
      "estratégia de investimento",
      "rentabilidade anual",
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

export default function PortfolioAnualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

