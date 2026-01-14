import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { year: string };
}): Promise<Metadata> {
  const year = parseInt(params.year, 10);
  
  const title = `Ranking Anual ${year} - Investidores com Melhor Rentabilidade do Ano`;
  const description = `Ranking anual de investidores de ${year}. Veja quem teve melhor rentabilidade acumulada no ano e competiu pelos prêmios em dinheiro. Top 3 recebem prêmios de R$300, R$200 e R$100.`;
  
  return {
    title,
    description,
    keywords: [
      `ranking anual ${year}`,
      "ranking de investidores",
      "competição de investimentos",
      "premiação anual",
      "prêmios em dinheiro",
      "rentabilidade anual",
      "melhores investidores do ano",
    ],
    openGraph: {
      title,
      description,
      url: `${baseUrl}/ranking/anual/${year}`,
      type: "website",
      siteName: "Hold Arena",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/ranking/anual/${year}`,
    },
  };
}

export default function RankingAnualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

