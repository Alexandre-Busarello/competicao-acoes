import { Metadata } from 'next';
import { ProLandingPageClient } from './ProLandingPageClient';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Membro Pro - Desbloqueie Funcionalidades Exclusivas | Hold Arena",
  description: "Torne-se Membro Pro e desbloqueie acesso completo a todas as carteiras, ranking GGB, premiação dobrada e muito mais. Compare os planos Gratuito e Pro.",
  keywords: [
    "membro pro",
    "assinatura premium",
    "plano pro",
    "funcionalidades exclusivas",
    "ranking GGB",
    "premiação dobrada",
    "acesso completo carteiras",
    "hold arena pro",
  ],
  openGraph: {
    title: "Membro Pro - Hold Arena",
    description: "Desbloqueie funcionalidades exclusivas, acesse todas as carteiras e receba premiação dobrada nos prêmios anuais",
    url: `${baseUrl}/pro`,
    type: "website",
    siteName: "Hold Arena",
  },
  twitter: {
    card: "summary",
    title: "Membro Pro - Hold Arena",
    description: "Desbloqueie funcionalidades exclusivas, acesse todas as carteiras e receba premiação dobrada nos prêmios anuais",
  },
  alternates: {
    canonical: `${baseUrl}/pro`,
  },
};

export default function ProPage() {
  return (
    <>
      {/* Structured data para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Membro Pro - Hold Arena",
            description: "Compare os planos Gratuito e Pro. Desbloqueie funcionalidades exclusivas com assinatura premium.",
            url: `${baseUrl}/pro`,
            mainEntity: {
              "@type": "Product",
              name: "Membro Pro",
              description: "Assinatura premium com acesso completo a todas as funcionalidades",
            },
          }),
        }}
      />
      <ProLandingPageClient />
    </>
  );
}

