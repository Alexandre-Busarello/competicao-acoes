import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Hold Arena - Rede Social do Investidor | Teste sua Estratégia e Seja Premiado",
  description: "Hold Arena é a rede social do investidor. Teste sua estratégia de investimentos, compartilhe sua carteira pública e compita no ranking com premiação por performance. Onde investidores se testam.",
  keywords: [
    "rede social de investimentos",
    "ranking de investidores",
    "competição de investimentos",
    "teste de estratégia de investimento",
    "premiação por performance",
    "carteira de investimentos pública",
    "comunidade de investidores",
    "social trading",
    "ranking mensal de investidores",
    "ranking anual de investidores",
    "investimentos",
    "ações",
    "bolsa de valores",
  ],
  openGraph: {
    title: "Hold Arena - Rede Social do Investidor",
    description: "Teste sua estratégia de investimentos e seja premiado. Onde investidores se testam.",
    url: `${baseUrl}/rede-social-investidor`,
    type: "website",
    siteName: "Hold Arena",
    images: [
      {
        url: `${baseUrl}/logo-combinada-claro.svg`,
        width: 1200,
        height: 630,
        alt: "Hold Arena - Rede Social do Investidor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hold Arena - Rede Social do Investidor",
    description: "Teste sua estratégia de investimentos e seja premiado",
    images: [`${baseUrl}/logo-combinada-claro.svg`],
  },
  alternates: {
    canonical: `${baseUrl}/rede-social-investidor`,
  },
};

export default function RedeSocialInvestidorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Hold Arena - Rede Social do Investidor",
            description: "Rede social do investidor onde estratégias são testadas e premiadas",
            url: `${baseUrl}/rede-social-investidor`,
            mainEntity: {
              "@type": "Organization",
              name: "Hold Arena",
              description: "Rede social do investidor - Teste sua estratégia e seja premiado",
            },
          }),
        }}
      />
      {children}
    </>
  );
}

