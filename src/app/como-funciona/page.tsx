import { Metadata } from 'next';
import { ComoFuncionaPageClient } from './ComoFuncionaPageClient';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Como Funciona - Ranking de Investidores e Regras da Competição",
  description: "Entenda como funciona o ranking de investidores da Hold Arena. Regras da competição mensal e anual, cálculo de rentabilidade, critérios de desempate, premiação e muito mais.",
  keywords: [
    "como funciona ranking de investimentos",
    "regras da competição",
    "cálculo de rentabilidade",
    "ranking mensal",
    "ranking anual",
    "premiação de investidores",
    "medalhas de investidores",
    "critérios de desempate",
    "como calcular rentabilidade",
    "competição de investimentos",
  ],
  openGraph: {
    title: "Como Funciona - Hold Arena",
    description: "Entenda como funciona o ranking de investidores e as regras da competição",
    url: `${baseUrl}/como-funciona`,
    type: "website",
    siteName: "Hold Arena",
  },
  twitter: {
    card: "summary",
    title: "Como Funciona - Hold Arena",
    description: "Entenda como funciona o ranking de investidores e as regras da competição",
  },
  alternates: {
    canonical: `${baseUrl}/como-funciona`,
  },
};

export default function ComoFuncionaPage() {
  return <ComoFuncionaPageClient />;
}

