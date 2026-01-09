'use client';

import { Trophy, TrendingUp, Users, Award, ArrowRight, Sparkles, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { useAuth } from '@/lib/auth/client';
import Link from 'next/link';
import { SHOW_MIC_METHOD } from '@/lib/config/features';

export function EmptyRankingState() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-8 md:py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 md:mb-6 shadow-lg animate-pulse">
            <Trophy className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 md:mb-6 shadow-lg">
            <Trophy className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-4">
            Seja o Primeiro no Ranking!
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 md:mb-6 px-4">
            Compita com outros investidores e mostre suas habilidades. 
            Cadastre suas transações e comece a pontuar agora mesmo.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-3 md:mb-4">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Ranking em Tempo Real</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Veja sua posição atualizada a cada 15 minutos
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 dark:bg-purple-900 mb-3 md:mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Competição Justa</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Compare sua performance com outros investidores
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-yellow-300 transition-colors">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-3 md:mb-4">
                <Award className="h-5 w-5 md:h-6 md:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Prêmios e Reconhecimento</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Destaque-se e ganhe prêmios mensais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardContent className="p-4 md:p-6 lg:p-8">
            {!isAuthenticated ? (
              <div className="text-center space-y-4 md:space-y-6">
                <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                  <h3 className="text-xl md:text-2xl font-bold">Comece Agora Mesmo</h3>
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                </div>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-2">
                  Crie sua conta gratuita e comece a competir. 
                  Você poderá cadastrar transações, ver seu ranking e competir com outros investidores.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center px-2">
                  <Link href="/auth/login" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
                      Criar Conta Grátis
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <Link href="/auth/login" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
                        <Mail className="h-4 w-4 mr-2" />
                        Já tenho conta
                      </Button>
                    </Link>
                    <Link href="/como-funciona" className="w-full sm:w-auto">
                      <Button variant="ghost" size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
                        Como Funciona
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : !user?.isPremium ? (
              <div className="text-center space-y-4 md:space-y-6">
                <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                  <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                  <h3 className="text-xl md:text-2xl font-bold">Você está quase lá!</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-2">
                  Cadastre transações para aparecer no ranking. 
                  Faça upgrade para premium e desbloqueie acesso completo às carteiras de outros competidores.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center px-2">
                  <Link href="/minha-carteira" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
                      Cadastrar Transação
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <CheckoutCTA
                    source="empty_ranking_state_premium"
                    buttonText="Fazer Upgrade"
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto sm:min-w-[200px]"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 md:space-y-6">
                <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                  <h3 className="text-xl md:text-2xl font-bold">Você está no jogo!</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-2">
                  Cadastre sua primeira transação para começar a aparecer no ranking. 
                  Quanto mais transações você cadastrar, melhor será sua posição.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center px-2">
                  <Link href="/minha-carteira" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
                      Cadastrar Transação
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  {SHOW_MIC_METHOD && (
                    <Link href="/bruno-method" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
                        Ver MIC Method
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 md:mt-8 text-center px-4">
          <p className="text-xs md:text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Comece cadastrando suas transações mais recentes para aparecer no ranking rapidamente
          </p>
        </div>
      </div>
    </div>
  );
}

