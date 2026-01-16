import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Feed de Investimentos - Movimentos de Carteira e Estratégias",
  description: "Acompanhe movimentos de carteira, defesas de hold, teses e contrapontos da comunidade de investidores. Feed público com estratégias de investimento e análises.",
  keywords: [
    "feed de investimentos",
    "movimentos de carteira",
    "estratégias de investimento",
    "análise de investimentos",
    "comunidade de investidores",
    "social trading",
    "carteira de investimentos",
    "hold",
    "análise técnica",
    "análise fundamentalista",
  ],
  openGraph: {
    title: "Feed de Investimentos - Hold Arena",
    description: "Acompanhe movimentos de carteira e estratégias da comunidade de investidores",
    url: `${baseUrl}/feed`,
    type: "website",
    siteName: "Hold Arena",
  },
  twitter: {
    card: "summary",
    title: "Feed de Investimentos - Hold Arena",
    description: "Acompanhe movimentos de carteira e estratégias da comunidade",
  },
  alternates: {
    canonical: `${baseUrl}/feed`,
  },
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}






