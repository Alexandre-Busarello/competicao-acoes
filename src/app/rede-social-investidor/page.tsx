import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, TrendingUp, Users, Award, Target, Zap, Shield, BarChart3, MessageSquare, Wallet, Calendar, ArrowRight, Sparkles, Star, CheckCircle2, TrendingDown } from 'lucide-react';
import { rankingService } from '@/lib/services/ranking-service';
import { getCurrentPeriod } from '@/lib/utils/period-utils';

async function getTop3Ranking() {
  try {
    const current = getCurrentPeriod();
    const ranking = await rankingService.getRanking('mensal', current.year, current.month);
    
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
        monthlyReturn: entry.monthlyReturn || 0,
      })),
      totalParticipants: ranking.totalParticipants || 0,
    };
  } catch (error) {
    console.error('Error fetching top 3 ranking:', error);
    return null;
  }
}

export default async function RedeSocialInvestidorPage() {
  const top3Data = await getTop3Ranking();
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Impactante */}
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-background to-primary/10 py-8 md:py-0">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Badge - Oculto no mobile */}
            <div className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">Onde investidores se testam</span>
            </div>

            {/* Headline Principal */}
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground">
                A Rede Social do Investidor
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-medium">
                Onde investidores se testam
              </p>
            </div>

            {/* Value Proposition */}
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
              <p className="text-base md:text-xl lg:text-2xl text-muted-foreground leading-relaxed px-2">
                <span className="font-bold text-success">Teste sua estratégia e seja premiado.</span>
                <br className="hidden md:block" />
                <span className="hidden md:inline"> </span>
                Na Hold Arena não importa quem tem mais seguidores, e sim <span className="font-semibold text-success">mais rentabilidade</span>!
              </p>

              {/* Key Differentiators */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 pt-2 md:pt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm">
                  <Trophy className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                  <span className="text-xs md:text-sm font-medium">Prêmios em dinheiro</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="text-xs md:text-sm font-medium">100% Transparente</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-success" />
                  <span className="text-xs md:text-sm font-medium">Ranking em tempo real</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 md:pt-8">
              <Link href="/ranking">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-6 h-auto group hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                >
                  Ver Ranking
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/feed">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-lg px-8 py-6 h-auto hover:scale-105 transition-transform duration-300 border-2"
                >
                  Explorar Feed
                </Button>
              </Link>
            </div>

            {/* Top 3 Ranking */}
            {top3Data && top3Data.top3.length > 0 ? (
              <div className="pt-8 md:pt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3">
                      <Trophy className="h-4 w-4 text-warning" />
                      <p className="text-sm font-semibold text-primary">Top 3 do Ranking Mensal</p>
                    </div>
                    {top3Data.totalParticipants > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {top3Data.totalParticipants} {top3Data.totalParticipants === 1 ? 'participante' : 'participantes'} competindo
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {top3Data.top3.map((competitor, index) => {
                      const isFirst = index === 0;
                      const isSecond = index === 1;
                      const isThird = index === 2;
                      
                      return (
                        <Link
                          key={competitor.rank}
                          href={`/ranking`}
                          className="group"
                        >
                          <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                            isFirst 
                              ? 'border-warning/50 bg-gradient-to-br from-warning/15 via-warning/5 to-background shadow-warning/10' 
                              : isSecond
                              ? 'border-muted-foreground/40 bg-gradient-to-br from-muted/15 via-muted/5 to-background'
                              : 'border-orange-600/40 bg-gradient-to-br from-orange-600/15 via-orange-600/5 to-background'
                          }`}>
                            {/* Decoração de fundo */}
                            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${
                              isFirst ? 'bg-warning' : isSecond ? 'bg-muted-foreground' : 'bg-orange-600'
                            }`} />
                            
                            <CardContent className="p-6 relative z-10">
                              <div className="flex flex-col items-center gap-4">
                                {/* Posição e Medalha */}
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center justify-center w-14 h-14 rounded-full ${
                                    isFirst 
                                      ? 'bg-warning/20 text-warning shadow-lg shadow-warning/20' 
                                      : isSecond
                                      ? 'bg-muted-foreground/20 text-muted-foreground shadow-lg'
                                      : 'bg-orange-600/20 text-orange-600 shadow-lg'
                                  }`}>
                                    {isFirst ? (
                                      <Trophy className="h-7 w-7 fill-warning" />
                                    ) : isSecond ? (
                                      <Award className="h-7 w-7" />
                                    ) : (
                                      <Award className="h-7 w-7" />
                                    )}
                                  </div>
                                  <div className={`text-2xl font-bold ${
                                    isFirst ? 'text-warning' : isSecond ? 'text-muted-foreground' : 'text-orange-600'
                                  }`}>
                                    #{competitor.rank}
                                  </div>
                                </div>
                                
                                {/* Avatar */}
                                <div className="relative">
                                  <div className="relative">
                                    <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                                      {competitor.avatar ? (
                                        <AvatarImage 
                                          src={competitor.avatar} 
                                          alt={competitor.name}
                                          className="object-cover"
                                        />
                                      ) : null}
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        <Users className="h-10 w-10" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className={`absolute inset-0 rounded-full border-4 ${
                                      isFirst ? 'border-warning' : isSecond ? 'border-muted-foreground' : 'border-orange-600'
                                    } opacity-50 pointer-events-none`} />
                                  </div>
                                </div>
                                
                                {/* Nome */}
                                <div className="text-center">
                                  <p className="font-bold text-foreground text-base truncate max-w-[140px]">
                                    {competitor.name}
                                  </p>
                                </div>
                                
                                {/* Rentabilidade - Destaque */}
                                <div className={`text-center p-4 rounded-xl w-full ${
                                  competitor.monthlyReturn >= 0 
                                    ? 'bg-success/10 border border-success/20' 
                                    : 'bg-destructive/10 border border-destructive/20'
                                }`}>
                                  <p className={`text-2xl font-bold ${
                                    competitor.monthlyReturn >= 0 ? 'text-success' : 'text-destructive'
                                  }`}>
                                    {competitor.monthlyReturn >= 0 ? '+' : ''}
                                    {competitor.monthlyReturn.toFixed(2)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">Rentabilidade Mensal</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="text-center mt-6">
                    <Link href="/ranking">
                      <Button variant="outline" size="sm" className="group border-2">
                        Ver Ranking Completo
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3">
                    <Trophy className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-primary">Ranking Mensal</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Seja o primeiro a entrar no ranking!</p>
                  <Link href="/ranking" className="inline-block mt-4">
                    <Button variant="outline" size="sm">
                      Ver Ranking
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-20 md:py-32 relative bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Problem */}
            <Card className="border-destructive/20 bg-destructive/5 hover:shadow-lg transition-shadow duration-300 animate-in fade-in slide-in-from-left duration-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <TrendingDown className="h-6 w-6" />
                  O Problema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Nas redes sociais tradicionais, <strong className="text-foreground">quem fala mais ganha mais seguidores</strong>, 
                  mas isso não significa melhor performance em investimentos.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">✗</span>
                    <span>Estratégias não são testadas publicamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">✗</span>
                    <span>Não há transparência nas carteiras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">✗</span>
                    <span>Falta de incentivo para performance real</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Solution */}
            <Card className="border-success/20 bg-success/5 hover:shadow-lg transition-shadow duration-300 animate-in fade-in slide-in-from-right duration-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                  A Solução
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Na Hold Arena, <strong className="text-success">quem performa melhor ganha prêmios</strong>. 
                  Sua estratégia é testada publicamente e <strong className="text-success">premiada por resultados reais</strong>.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Estratégias expostas e testadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Carteiras 100% transparentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Premiação por performance real</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Essência do Produto - Destaque */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-2xl hover:shadow-primary/20 transition-all duration-500 animate-in fade-in zoom-in-95 duration-1000">
            <CardContent className="p-12 md:p-16 text-center space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
                <Target className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  &quot;Teste sua estratégia e seja premiado&quot;
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Não importa se a carteira reflete investimentos reais ou estratégicos.
                <br />
                <strong className="text-success">O que importa é a estratégia que está sendo colocada à prova.</strong>
              </p>
              <div className="pt-4">
                <div className="inline-block px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
                  <p className="text-sm font-semibold text-primary">
                    Sua estratégia de investimento vale prêmio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* O Significado da Arena - Storytelling */}
      <section className="py-20 md:py-32 bg-muted/50 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-4 mb-16 animate-in fade-in duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold">
              O Significado da <span className="text-primary">Arena</span>
            </h2>
            <p className="text-2xl md:text-3xl text-muted-foreground font-semibold italic">
              &quot;Onde investidores se testam.&quot;
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A arena é o espaço onde estratégias competem, decisões ficam expostas, 
              a comunidade reage e os melhores são premiados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Estratégias Competem',
                description: 'Suas decisões são expostas e avaliadas. Cada movimento conta.',
                color: 'text-primary',
                bgColor: 'bg-primary/10',
                borderColor: 'border-primary/20',
              },
              {
                icon: Shield,
                title: 'Decisões Expostas',
                description: 'Transparência total. Carteira pública, histórico auditável.',
                color: 'text-success',
                bgColor: 'bg-success/10',
                borderColor: 'border-success/20',
              },
              {
                icon: Users,
                title: 'Comunidade Reage',
                description: 'Acompanha, comenta e debate. Cada movimento vira aprendizado.',
                color: 'text-warning',
                bgColor: 'bg-warning/10',
                borderColor: 'border-warning/20',
              },
              {
                icon: Award,
                title: 'Melhores Premiados',
                description: 'Quem performa melhor sobe no ranking e ganha prêmio em dinheiro.',
                color: 'text-success',
                bgColor: 'bg-success/10',
                borderColor: 'border-success/20',
              },
            ].map((item, index) => (
              <Card
                key={index}
                className={`${item.bgColor} ${item.borderColor} border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-700`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${item.bgColor} mb-4`}>
                    <item.icon className={`h-8 w-8 ${item.color}`} />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* A Carteira como Expressão */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background" />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center space-y-8 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold">
              A Carteira como <span className="text-primary">Expressão da Estratégia</span>
            </h2>
            <p className="text-2xl md:text-3xl text-muted-foreground font-semibold italic">
              &quot;Mostre sua carteira. Defenda seu hold.&quot;
            </p>
          </div>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-xl animate-in fade-in zoom-in-95 duration-1000">
            <CardContent className="p-8 md:p-12">
              <p className="text-center text-lg text-muted-foreground mb-8">
                A carteira é o manifesto do investidor:
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: BarChart3, text: 'Reflete visão de mercado' },
                  { icon: Target, text: 'Escolhas conscientes' },
                  { icon: Shield, text: 'Capacidade de sustentar decisões' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="text-center p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <item.icon className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p className="font-semibold text-success">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-success/10 rounded-xl border border-success/20 text-center">
                <p className="text-muted-foreground">
                  Cada movimento vira <strong className="text-success">conteúdo</strong>,{' '}
                  <strong className="text-success">debate</strong> e{' '}
                  <strong className="text-success">aprendizado coletivo</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Rankings - Destaque Visual */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/50 via-background to-muted/50 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-4 mb-16 animate-in fade-in duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold">
              Rankings que <span className="text-primary">Testam Evidência</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dois rankings independentes que premiam consistência e performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Ranking Mensal */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-background shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden animate-in fade-in slide-in-from-left duration-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Ranking Mensal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <p className="text-muted-foreground">
                  Avalia desempenho no curto prazo. Cada mês é uma nova competição com rentabilidade resetada.
                </p>
                <div className="space-y-3">
                  <p className="font-semibold text-lg">Top 3 recebem medalhas:</p>
                  <div className="space-y-2">
                    {[
                      { icon: Trophy, text: 'Ouro - 1º lugar', color: 'text-warning' },
                      { icon: Award, text: 'Prata - 2º lugar', color: 'text-muted-foreground' },
                      { icon: Award, text: 'Bronze - 3º lugar', color: 'text-orange-600' },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                      >
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <span className="font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                  Reconhecimento visível no perfil público do usuário.
                </p>
              </CardContent>
            </Card>

            {/* Ranking Anual */}
            <Card className="border-warning/30 bg-gradient-to-br from-warning/10 to-background shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden animate-in fade-in slide-in-from-right duration-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-2xl" />
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-full bg-warning/20">
                    <Trophy className="h-6 w-6 text-warning" />
                  </div>
                  <CardTitle className="text-2xl">Ranking Anual</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <p className="text-muted-foreground">
                  Premia consistência ao longo do tempo. Retorno acumulado de todas as operações do ano.
                </p>
                <div className="space-y-3">
                  <p className="font-semibold text-lg">Top 3 recebem prêmios em dinheiro:</p>
                  <div className="space-y-2">
                    {[
                      { icon: Trophy, text: 'Medalha de Ouro', amount: 'R$ 300,00' },
                      { icon: Award, text: 'Medalha de Prata', amount: 'R$ 200,00' },
                      { icon: Award, text: 'Medalha de Bronze', amount: 'R$ 100,00' },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-warning" />
                          <span className="font-medium">{item.text}</span>
                        </div>
                        <span className="font-bold text-warning">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-warning">Membros PRO recebem o prêmio em dobro</strong>
                    <br />
                    <span className="text-xs">(mínimo 90 dias antes do fechamento)</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pilares do Produto */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-4 mb-16 animate-in fade-in duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold">
              Pilares do <span className="text-primary">Produto</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                icon: Zap,
                title: 'Teste de Estratégia',
                description: 'A Hold Arena é um campo de prova onde teses são expostas, decisões são acompanhadas e a comunidade responde.',
                gradient: 'from-primary/20 to-primary/5',
              },
              {
                number: '2',
                icon: Shield,
                title: 'Transparência',
                description: 'Histórico público, regras claras e resultados visíveis. Tudo é transparente e auditável.',
                gradient: 'from-success/20 to-success/5',
              },
              {
                number: '3',
                icon: TrendingUp,
                title: 'Competição Saudável',
                description: 'Rankings recorrentes, recomeços mensais e evolução contínua. Cada mês é uma nova chance.',
                gradient: 'from-warning/20 to-warning/5',
              },
            ].map((pillar, index) => (
              <Card
                key={index}
                className={`border-2 bg-gradient-to-br ${pillar.gradient} hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-700`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-xl">
                      {pillar.number}
                    </div>
                    <div className="p-2 rounded-lg bg-background/50">
                      <pillar.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Componentes do Produto */}
      <section className="py-20 md:py-32 bg-muted/50 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-4 mb-16 animate-in fade-in duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold">
              Componentes do <span className="text-primary">Produto</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: MessageSquare,
                title: 'Feed',
                items: ['Movimentos de carteira', 'Defesas de hold', 'Teses e contrapontos', 'Destaques da arena'],
              },
              {
                icon: Wallet,
                title: 'Carteiras',
                items: ['Estratégias públicas', 'Histórico de decisões', 'Base para rankings', 'Composição e alocação'],
              },
              {
                icon: Trophy,
                title: 'Ranking',
                items: ['Mensal e anual', 'Medalhas e prêmios', 'Destaque por desempenho', 'Transparência total'],
              },
              {
                icon: Users,
                title: 'Perfil',
                items: ['Estratégias criadas', 'Medalhas conquistadas', 'Histórico público', 'Status Free ou PRO'],
              },
            ].map((component, index) => (
              <Card
                key={index}
                className="hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <component.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{component.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {component.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Posicionamento Final - Destaque */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30 shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
            <CardContent className="p-12 md:p-16 text-center space-y-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                A Hold Arena é uma rede social de investimentos focada em estratégia e transparência. 
                Aqui, investidores mostram suas carteiras, defendem suas decisões e testam suas ideias diante da comunidade.
              </p>
              <div className="pt-4">
                <p className="text-2xl md:text-4xl font-bold text-success">
                  &quot;O ranking não mede opinião, mede resultado.&quot;
                </p>
              </div>
              <div className="pt-4">
                <p className="text-xl md:text-2xl font-semibold text-success">
                  Quem sustenta boas estratégias sobe no ranking e ganha prêmio em dinheiro.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mantra da Marca */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-8 animate-in fade-in duration-1000">
          <h2 className="text-3xl md:text-5xl font-bold">
            Mantra da <span className="text-primary">Marca</span>
          </h2>
          <div className="space-y-6">
            {[
              'Onde investidores se testam.',
              'Mostre sua carteira. Defenda seu hold.',
              'Sua estratégia de investimento vale prêmio.',
            ].map((mantra, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <p className="text-xl md:text-2xl text-muted-foreground italic">
                  &quot;{mantra}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final - Impactante */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/30 shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
            <CardContent className="p-12 md:p-16 text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold">
                Pronto para <span className="text-primary">começar?</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Junte-se à comunidade de investidores que testam estratégias e competem por prêmios.
                <br />
                <strong className="text-success">Mostre sua carteira, defenda seu hold e seja premiado.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/ranking">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-lg px-10 py-7 h-auto group hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                  >
                    Ver Ranking
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto text-lg px-10 py-7 h-auto border-2 hover:scale-105 transition-transform duration-300"
                  >
                    Explorar Feed
                  </Button>
                </Link>
                <Link href="/como-funciona">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto text-lg px-10 py-7 h-auto border-2 hover:scale-105 transition-transform duration-300"
                  >
                    Como Funciona
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
