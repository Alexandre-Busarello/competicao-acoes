import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { NavigationWrapper } from "@/components/navigation/NavigationWrapper";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { PushNotificationPrompt } from "@/components/pwa/PushNotificationPrompt";
import { BadgeUpdater } from "@/components/pwa/BadgeUpdater";
import { TrackAccess } from "@/components/tracking/TrackAccess";
import { FooterWrapper } from "@/components/shared/FooterWrapper";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: "Hold Arena - Rede Social do Investidor | Ranking de Investimentos",
    template: "%s | Hold Arena",
  },
  description: "Hold Arena é a rede social do investidor. Teste sua estratégia de investimentos, compartilhe sua carteira e compita no ranking público com premiação por performance. Onde investidores se testam.",
  keywords: [
    "rede social de investimentos",
    "ranking de investidores",
    "competição de investimentos",
    "carteira de investimentos pública",
    "teste de estratégia de investimento",
    "premiação por performance",
    "ranking mensal de investidores",
    "ranking anual de investidores",
    "investimentos",
    "ações",
    "bolsa de valores",
    "análise técnica",
    "análise fundamentalista",
    "carteira de investimentos",
    "rentabilidade de investimentos",
    "estratégias de investimento",
    "comunidade de investidores",
    "social trading",
    "competição de traders",
  ],
  manifest: "/manifest.json",
  authors: [{ name: "Hold Arena" }],
  creator: "Hold Arena",
  publisher: "Hold Arena",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    siteName: "Hold Arena",
    title: "Hold Arena - Rede Social do Investidor | Ranking de Investimentos",
    description: "Teste sua estratégia de investimentos e seja premiado. A rede social onde investidores mostram suas carteiras e competem no ranking público.",
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
    description: "Teste sua estratégia de investimentos e seja premiado. Onde investidores se testam.",
    images: [`${baseUrl}/logo-combinada-claro.svg`],
  },
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hold Arena",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const theme = savedTheme || systemTheme;
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  // Ignore errors in SSR
                }
              })();
            `,
          }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hold Arena" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/favicon-claro.svg" />
        <link rel="icon" href="/favicon-claro.svg" type="image/svg+xml" />
        {/* Splash screens para iOS */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-640-1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828-1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1284-2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1179-2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Hold Arena",
              description: "Rede social do investidor onde estratégias são testadas e premiadas",
              url: baseUrl,
              logo: `${baseUrl}/logo-combinada-claro.svg`,
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Service",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Hold Arena",
              url: baseUrl,
              description: "Rede social do investidor - Teste sua estratégia e seja premiado",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${baseUrl}/feed?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <ThemeProvider>
          <QueryProvider>
            <div className="min-h-screen bg-background">
              <ServiceWorkerRegistration />
              <InstallPrompt />
              <BadgeUpdater />
              <TrackAccess />
              <NavigationWrapper>
                {children}
              </NavigationWrapper>
              <FooterWrapper />
              <UpdatePrompt />
              <PushNotificationPrompt />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

