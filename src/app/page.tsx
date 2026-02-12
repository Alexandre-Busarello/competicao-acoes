import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, ArrowRight, Users, Award } from 'lucide-react';
import { rankingService } from '@/lib/services/ranking-service';
import { getCurrentPeriod } from '@/lib/utils/period-utils';
import { EmailCaptureForm } from '@/components/shared/EmailCaptureForm';
import { HomePageClient } from './HomePageClient';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Hold Arena - Compita no Ranking de Investidores e Seja Premiado",
  description: "Teste sua estratégia de investimentos e compita no ranking público. Prêmios em dinheiro para os melhores. Cadastre-se agora e comece a competir.",
  keywords: [
    "ranking de investidores",
    "competição de investimentos",
    "prêmios em dinheiro",
    "teste de estratégia de investimento",
    "ranking anual de investidores",
    "investimentos",
    "ações",
    "bolsa de valores",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    siteName: "Hold Arena",
    title: "Hold Arena - Compita no Ranking de Investidores",
    description: "Teste sua estratégia e seja premiado. Onde investidores se testam.",
    images: [
      {
        url: `${baseUrl}/logo-combinada-claro.svg`,
        width: 1200,
        height: 630,
        alt: "Hold Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hold Arena - Compita no Ranking de Investidores",
    description: "Teste sua estratégia e seja premiado",
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
};

async function getTop3Ranking() {
  try {
    const current = getCurrentPeriod();
    // Buscar ranking anual (premiação é apenas no anual)
    const ranking = await rankingService.getRanking('anual', current.year);
    
    if (!ranking || !ranking.ranking || ranking.ranking.length === 0) {
      return null;
    }
    
    // Pegar top 3
    const top3 = ranking.ranking.slice(0, 3);
    
    return {
      top3: top3.map((entry: any) => ({
        rank: entry.rank,
        name: entry.name,
        avatar: entry.avatar,
        annualReturn: entry.annualReturn || entry.monthlyReturn || 0,
      })),
      totalParticipants: ranking.totalParticipants || 0,
    };
  } catch (error) {
    console.error('Error fetching top 3 ranking:', error);
    return null;
  }
}

export default async function HomePage() {
  // Redirecionar usuários autenticados para ranking
  const session = await getServerSession();
  if (session) {
    redirect('/ranking');
  }

  const top3Data = await getTop3Ranking();

  return (
    <>
      {/* Structured data para página inicial */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Hold Arena - Ranking de Investidores",
            description: "Compita no ranking de investidores e seja premiado por sua performance",
            url: baseUrl,
            mainEntity: {
              "@type": "Organization",
              name: "Hold Arena",
              description: "Onde investidores se testam",
            },
          }),
        }}
      />
      
      <div className="min-h-screen flex flex-col">
        {/* Hero Section - Focado em Conversão */}
        <section className="relative flex-1 flex items-center justify-center py-12 md:py-20 bg-gradient-to-br from-primary/20 via-background to-primary/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center space-y-6 mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Onde Investidores se Testam
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Compita no ranking público e seja premiado por sua performance real
              </p>
              
              {/* Email Capture Form */}
              <div className="max-w-md mx-auto mt-8">
                <EmailCaptureForm 
                  source="homepage"
                  buttonText="Participar Agora"
                  placeholder="Seu melhor email"
                />
                <p className="text-xs text-muted-foreground mt-3">
                  Cadastre-se gratuitamente e comece a competir hoje mesmo
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <Link href="/como-funciona" className="underline hover:text-foreground">
                    Veja como funciona e as regras da competição
                  </Link>
                </p>
              </div>
            </div>

            {/* Pódium */}
            {top3Data && top3Data.top3.length > 0 ? (
              <div className="mt-16">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3">
                    <Trophy className="h-4 w-4 text-warning" />
                    <p className="text-sm font-semibold text-primary">Top 3 do Ranking Anual</p>
                  </div>
                  {top3Data.totalParticipants > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {top3Data.totalParticipants} {top3Data.totalParticipants === 1 ? 'participante' : 'participantes'} competindo
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    <Link href="/como-funciona" className="underline hover:text-foreground">
                      Premiação apenas no ranking anual. Veja as regras completas
                    </Link>
                  </p>
                </div>
                
                {/* Pódium Layout */}
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto items-end">
                  {/* 2º Lugar */}
                  {top3Data.top3[1] && (
                    <div className="flex flex-col items-center">
                      <Card className="w-full border-muted-foreground/40 bg-gradient-to-br from-muted/15 via-muted/5 to-background">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted-foreground/20 text-muted-foreground">
                              <Award className="h-6 w-6" />
                            </div>
                          </div>
                          <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-muted-foreground">
                            {top3Data.top3[1].avatar ? (
                              <AvatarImage src={top3Data.top3[1].avatar} alt={top3Data.top3[1].name} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Users className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-bold text-sm mb-2 truncate w-full">
                            {top3Data.top3[1].name}
                          </p>
                          <p className={`text-lg font-bold ${
                            top3Data.top3[1].annualReturn >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {top3Data.top3[1].annualReturn >= 0 ? '+' : ''}
                            {top3Data.top3[1].annualReturn.toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Retorno Anual</p>
                        </CardContent>
                      </Card>
                      <div className="text-2xl font-bold text-muted-foreground mt-2">#2</div>
                    </div>
                  )}

                  {/* 1º Lugar */}
                  {top3Data.top3[0] && (
                    <div className="flex flex-col items-center">
                      <Card className="w-full border-warning/50 bg-gradient-to-br from-warning/15 via-warning/5 to-background shadow-lg">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/20 text-warning">
                              <Trophy className="h-6 w-6 fill-warning" />
                            </div>
                          </div>
                          <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-warning">
                            {top3Data.top3[0].avatar ? (
                              <AvatarImage src={top3Data.top3[0].avatar} alt={top3Data.top3[0].name} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Users className="h-10 w-10" />
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-bold mb-2 truncate w-full">
                            {top3Data.top3[0].name}
                          </p>
                          <p className={`text-xl font-bold ${
                            top3Data.top3[0].annualReturn >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {top3Data.top3[0].annualReturn >= 0 ? '+' : ''}
                            {top3Data.top3[0].annualReturn.toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Retorno Anual</p>
                        </CardContent>
                      </Card>
                      <div className="text-3xl font-bold text-warning mt-2">#1</div>
                    </div>
                  )}

                  {/* 3º Lugar */}
                  {top3Data.top3[2] && (
                    <div className="flex flex-col items-center">
                      <Card className="w-full border-orange-600/40 bg-gradient-to-br from-orange-600/15 via-orange-600/5 to-background">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-600/20 text-orange-600">
                              <Award className="h-6 w-6" />
                            </div>
                          </div>
                          <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-orange-600">
                            {top3Data.top3[2].avatar ? (
                              <AvatarImage src={top3Data.top3[2].avatar} alt={top3Data.top3[2].name} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Users className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-bold text-sm mb-2 truncate w-full">
                            {top3Data.top3[2].name}
                          </p>
                          <p className={`text-lg font-bold ${
                            top3Data.top3[2].annualReturn >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {top3Data.top3[2].annualReturn >= 0 ? '+' : ''}
                            {top3Data.top3[2].annualReturn.toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Retorno Anual</p>
                        </CardContent>
                      </Card>
                      <div className="text-2xl font-bold text-orange-600 mt-2">#3</div>
                    </div>
                  )}
                </div>

                <div className="text-center mt-8 space-y-3">
                  <Link href="/ranking/anual">
                    <Button variant="outline" size="sm">
                      Ver Ranking Anual Completo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <div>
                    <Link href="/como-funciona" className="text-xs text-muted-foreground underline hover:text-foreground">
                      Veja as regras e como funciona a premiação
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3">
                  <Trophy className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Ranking Anual</p>
                </div>
                <p className="text-muted-foreground mb-4">Seja o primeiro a entrar no ranking!</p>
                <p className="text-xs text-muted-foreground">
                  <Link href="/como-funciona" className="underline hover:text-foreground">
                    Veja como funciona e as regras da competição
                  </Link>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-12 bg-muted/50 border-t">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">
              Pronto para competir?
            </h2>
            <p className="text-muted-foreground mb-6">
              Cadastre-se gratuitamente e comece a competir hoje mesmo
            </p>
            <div className="max-w-md mx-auto">
              <EmailCaptureForm 
                source="homepage_bottom"
                buttonText="Começar Agora"
                placeholder="Seu melhor email"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <Link href="/como-funciona" className="underline hover:text-foreground">
                Premiação apenas no ranking anual. Veja as regras completas
              </Link>
            </p>
          </div>
        </section>
      </div>

      {/* Client component para redirecionamento de usuários autenticados */}
      <HomePageClient />
    </>
  );
}
