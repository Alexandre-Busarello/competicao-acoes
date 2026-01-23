'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Check, 
  X, 
  TrendingUp, 
  Eye, 
  Award, 
  Gift, 
  BarChart3,
  Wallet,
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SHOW_MIC_METHOD } from '@/lib/config/features';
import { useAuth } from '@/lib/auth/client';
import Link from 'next/link';

interface Feature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  icon?: React.ReactNode;
}

const features: Feature[] = [
  {
    name: 'Acesso a todas as carteiras',
    free: 'Apenas primeiro ativo visível',
    pro: true,
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    name: 'Visualização completa de tickers',
    free: 'Tickers ofuscados (XXXX)',
    pro: true,
    icon: <Eye className="h-5 w-5" />,
  },
  {
    name: 'Valores e preços completos',
    free: 'Valores ofuscados (R$ XXXX)',
    pro: true,
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: 'Ranking GGB completo',
    free: false,
    pro: true,
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    name: 'Scores detalhados (Greenblatt, Graham, Bazin)',
    free: false,
    pro: true,
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: 'Breakdown completo de indicadores',
    free: false,
    pro: true,
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: 'Dados financeiros atualizados',
    free: false,
    pro: true,
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: 'Elegível para prêmios anuais',
    free: false,
    pro: true,
    icon: <Award className="h-5 w-5" />,
  },
  {
    name: 'Premiação dobrada no ranking anual',
    free: false,
    pro: true,
    icon: <Gift className="h-5 w-5" />,
  },
  ...(SHOW_MIC_METHOD ? [{
    name: 'Carteira oficial do Bruno',
    free: false,
    pro: true,
    icon: <Crown className="h-5 w-5" />,
  } as Feature] : []),
];

interface ConditionalCTAProps {
  source?: string;
  buttonText?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  className?: string;
}

function ConditionalCTA({ 
  source = 'pro_landing_page',
  buttonText = 'Tornar-se Membro Pro',
  size = 'default',
  variant = 'default',
  className
}: ConditionalCTAProps) {
  const { user } = useAuth();
  const isPro = user?.isPremium ?? false;

  if (isPro) {
    // Se for mobile (className contém w-full sem sm:w-auto), mostrar apenas um botão principal
    const isMobileOnly = className?.includes('w-full') && !className?.includes('sm:w-auto');
    
    if (isMobileOnly) {
      return (
        <Link href="/ranking-ggb" className="w-full">
          <Button variant={variant} size={size} className={`w-full ${className?.replace('w-full', '').trim() || ''}`}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver Ranking GGB
          </Button>
        </Link>
      );
    }
    
    // Desktop ou seção CTA: mostrar múltiplos botões
    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link href="/ranking-ggb" className="flex-1">
          <Button variant={variant} size={size} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver Ranking GGB
          </Button>
        </Link>
        <Link href="/feed" className="flex-1">
          <Button variant="outline" size={size} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Ver Feed
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <CheckoutCTA
      source={source}
      buttonText={buttonText}
      size={size}
      variant={variant}
      className={className}
    />
  );
}

export function ProLandingPageClient() {
  const { user } = useAuth();
  const isPro = user?.isPremium ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Torne-se <span className="text-primary">Membro Pro</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Desbloqueie funcionalidades exclusivas, acesse todas as carteiras e receba premiação dobrada nos prêmios anuais
            </p>
          </div>

          {isPro && (
            <Card className="max-w-md mx-auto mb-8 border-success/30 bg-success/5">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-success" />
                  <span className="font-semibold text-success">Você já é Membro Pro!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aproveite todos os benefícios da sua assinatura
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Compare os Planos
          </h2>

          {/* Mobile: Stacked Cards */}
          <div className="block lg:hidden space-y-6">
            {/* Pro Plan Card */}
            <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  RECOMENDADO
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">Membro Pro</CardTitle>
                </div>
                <p className="text-muted-foreground">Acesso completo a todas as funcionalidades</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.pro === true ? (
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{feature.name}</p>
                      {typeof feature.pro === 'string' && (
                        <p className="text-xs text-muted-foreground mt-1">{feature.pro}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-4 mt-6 border-t">
                  <ConditionalCTA
                    source="pro_landing_page"
                    buttonText="Tornar-se Membro Pro"
                    size="lg"
                    variant="default"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Free Plan Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Gratuito</CardTitle>
                <p className="text-muted-foreground">Plano básico para começar</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.free === true ? (
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    ) : feature.free === false ? (
                      <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{feature.name}</p>
                      {typeof feature.free === 'string' && (
                        <p className="text-xs text-muted-foreground mt-1">{feature.free}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Desktop: Side by Side Table */}
          <div className="hidden lg:block">
            <Card className="border-2">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-6 font-semibold">Funcionalidade</th>
                        <th className="text-center p-6 font-semibold w-1/3">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-xl">Gratuito</span>
                            <span className="text-sm text-muted-foreground font-normal">Plano básico</span>
                          </div>
                        </th>
                        <th className="text-center p-6 font-semibold w-1/3 relative">
                          <div className="absolute top-2 right-2">
                            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              RECOMENDADO
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Crown className="h-5 w-5 text-primary" />
                              <span className="text-xl">Membro Pro</span>
                            </div>
                            <span className="text-sm text-muted-foreground font-normal">Acesso completo</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((feature, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              {feature.icon && (
                                <div className="text-muted-foreground">
                                  {feature.icon}
                                </div>
                              )}
                              <span className="font-medium">{feature.name}</span>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            {feature.free === true ? (
                              <Check className="h-6 w-6 text-success mx-auto" />
                            ) : feature.free === false ? (
                              <X className="h-6 w-6 text-muted-foreground mx-auto" />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Lock className="h-5 w-5 text-warning" />
                                <span className="text-xs text-muted-foreground">{feature.free}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-6 text-center bg-primary/5">
                            {feature.pro === true ? (
                              <Check className="h-6 w-6 text-success mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 border-t bg-muted/30">
                  <div className="flex justify-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <Link href="/como-funciona">
                        <button className="w-full px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors">
                          Saiba mais
                        </button>
                      </Link>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <ConditionalCTA
                        source="pro_landing_page"
                        buttonText="Tornar-se Membro Pro"
                        size="lg"
                        variant="default"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Por que ser Membro Pro?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Visualização Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Veja todos os ativos, tickers e valores das carteiras sem restrições. Acesse informações completas para tomar decisões de investimento mais informadas.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 2 */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Ranking GGB Exclusivo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acesse o ranking quantitativo baseado na metodologia GGB (Greenblatt-Graham-Bazin) com scores detalhados e análise profissional de oportunidades de investimento.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 3 */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Premiação Dobrada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Membros Pro recebem o dobro dos prêmios no ranking anual. 1º lugar: R$ 600, 2º lugar: R$ 400, 3º lugar: R$ 200 + medalhas exclusivas.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 4 */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Elegível para Prêmios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Participe dos prêmios anuais em dinheiro. Membros Pro têm acesso exclusivo a competições com premiação em dinheiro e medalhas.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 5 */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Análise Quantitativa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acesse breakdown completo de indicadores financeiros, dados atualizados e análise quantitativa profissional para identificar as melhores oportunidades.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 6 */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Todas as Carteiras</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Explore todas as carteiras dos participantes sem limitações. Veja estratégias completas e aprenda com os melhores investidores da plataforma.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 sm:p-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Pronto para desbloquear tudo?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Torne-se Membro Pro hoje e tenha acesso completo a todas as funcionalidades exclusivas da plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <ConditionalCTA
                  source="pro_landing_page_cta"
                  buttonText="Tornar-se Membro Pro"
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto min-w-[200px]"
                />
                <Link href="/como-funciona">
                  <button className="w-full sm:w-auto px-6 py-3 text-sm border rounded-md hover:bg-muted transition-colors flex items-center gap-2 justify-center">
                    Entenda como funciona
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

