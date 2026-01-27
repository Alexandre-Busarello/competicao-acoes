import { Metadata } from 'next';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { year: string; month: string };
}): Promise<Metadata> {
  const year = parseInt(params.year, 10);
  const month = parseInt(params.month, 10);
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const monthName = monthNames[month - 1] || '';
  
  const title = `Ranking Mensal ${monthName}/${year} - Investidores com Melhor Rentabilidade`;
  const description = `Ranking mensal de investidores de ${monthName}/${year}. Veja quem teve melhor rentabilidade e competiu pelas medalhas de ouro, prata e bronze. Top 3 recebem medalhas.`;
  
  return {
    title,
    description,
    keywords: [
      `ranking mensal ${monthName} ${year}`,
      "ranking de investidores",
      "competição de investimentos",
      "premiação mensal",
      "medalhas de investidores",
      "rentabilidade mensal",
      "melhores investidores",
    ],
    openGraph: {
      title,
      description,
      url: `${baseUrl}/ranking/mensal/${year}/${month.toString().padStart(2, '0')}`,
      type: "website",
      siteName: "Hold Arena",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/ranking/mensal/${year}/${month.toString().padStart(2, '0')}`,
    },
  };
}

export default function RankingMensalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}























