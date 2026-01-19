import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Ranking de Investidores - Competição Mensal e Anual",
  description: "Ranking público de investidores com premiação por performance. Competição mensal com medalhas e ranking anual com prêmios em dinheiro. Veja quem tem melhor rentabilidade.",
  keywords: [
    "ranking de investidores",
    "competição de investimentos",
    "ranking mensal de investidores",
    "ranking anual de investidores",
    "premiação por performance",
    "rentabilidade de investimentos",
    "melhores investidores",
    "competição de traders",
  ],
  openGraph: {
    title: "Ranking de Investidores - Hold Arena",
    description: "Ranking público de investidores com premiação por performance",
    url: `${baseUrl}/ranking`,
    type: "website",
    siteName: "Hold Arena",
  },
  twitter: {
    card: "summary",
    title: "Ranking de Investidores - Hold Arena",
    description: "Ranking público de investidores com premiação por performance",
  },
  alternates: {
    canonical: `${baseUrl}/ranking`,
  },
};

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}








