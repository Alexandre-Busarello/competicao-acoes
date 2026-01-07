'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-4xl">
          <Link href="/ranking">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Como Funciona</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Introdução */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Sobre o Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              O Ranking de Investidores é uma competição onde você pode testar suas estratégias de investimento 
              e competir com outros participantes. Quanto maior sua rentabilidade, melhor sua posição no ranking.
            </p>
            <p className="text-muted-foreground">
              O ranking é atualizado automaticamente a cada 15 minutos com os preços mais recentes do mercado, 
              garantindo que todos os participantes sejam avaliados com base nos mesmos dados.
            </p>
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Como o Ranking é Calculado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Registre suas Transações</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione suas compras e vendas de ativos através da tela "Minha Carteira". 
                    Cada transação deve incluir o ticker do ativo, quantidade e o preço será obtido 
                    automaticamente do Yahoo Finance no momento da execução.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Cálculo da Rentabilidade</h3>
                  <p className="text-sm text-muted-foreground">
                    Sua rentabilidade é calculada comparando o valor atual da sua carteira (baseado nos 
                    preços de mercado) com o valor total investido. A fórmula é simples:
                  </p>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <code className="text-sm">
                      Rentabilidade = ((Valor Atual - Valor Investido) / Valor Investido) × 100%
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Posicionamento no Ranking</h3>
                  <p className="text-sm text-muted-foreground">
                    Os participantes são ordenados por rentabilidade (do maior para o menor). 
                    Quanto maior sua rentabilidade percentual, melhor sua posição. A quantidade investida 
                    não importa - apenas a rentabilidade proporcional é considerada.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regra Importante sobre Dividendos */}
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Regra Importante: Apenas Ganho de Capital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-md border border-orange-200 dark:border-orange-800">
              <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                ⚠️ Atenção: O ranking considera APENAS ganho de capital
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                Dividendos e proventos pagos pelos ativos <strong>NÃO são considerados</strong> no cálculo 
                da rentabilidade. Isso significa que se você escolher ativos que pagam dividendos, você precisa 
                reinvestir manualmente o valor recebido.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Como Funciona com Dividendos
              </h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Exemplo prático:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Você compra 100 ações de PETR4 a R$ 30,00 cada (total: R$ 3.000,00)</li>
                  <li>PETR4 paga R$ 0,50 por ação em dividendos (total: R$ 50,00)</li>
                  <li>O sistema <strong>NÃO</strong> considera esses R$ 50,00 na sua rentabilidade</li>
                  <li>Para que o dividendo seja considerado, você deve registrar uma nova compra de R$ 50,00</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-background rounded-md border border-border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Ex-Dividendos
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Fique atento à <strong>data ex-dividendos</strong> dos ativos que você possui. 
                  Nesta data, o valor do dividendo é descontado do preço da ação.
                </p>
                <p className="text-sm text-muted-foreground">
                  Para manter sua rentabilidade correta no ranking, você deve:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-sm text-muted-foreground ml-2">
                  <li>Acompanhar as datas ex-dividendos dos seus ativos</li>
                  <li>Registrar uma nova transação de compra no valor do dividendo recebido</li>
                  <li>Fazer isso na mesma data ex-dividendos ou no dia seguinte</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outras Regras */}
        <Card>
          <CardHeader>
            <CardTitle>Outras Regras Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Preços do Yahoo Finance</h3>
                <p className="text-sm text-muted-foreground">
                  Todos os preços são obtidos automaticamente do Yahoo Finance no momento da execução da ordem. 
                  Isso garante que todos os participantes sejam avaliados com base nos mesmos dados de mercado.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Transações Apenas no Dia Corrente</h3>
                <p className="text-sm text-muted-foreground">
                  Para garantir a integridade do ranking, só são permitidas transações no dia corrente. 
                  Não é possível registrar transações retroativas.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Transações Irreversíveis</h3>
                <p className="text-sm text-muted-foreground">
                  Uma vez executada, uma transação não pode ser desfeita ou cancelada. Para sair de uma posição, 
                  é necessário registrar uma ordem de venda a mercado.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Atualização do Ranking</h3>
                <p className="text-sm text-muted-foreground">
                  O ranking é atualizado automaticamente a cada 15 minutos através de um processo automatizado 
                  que busca os preços mais recentes de todos os ativos e recalcula as rentabilidades.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">Pronto para começar?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre suas transações e comece a competir no ranking!
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/ranking">
                <Button>Ver Ranking</Button>
              </Link>
              <Link href="/carteira">
                <Button variant="outline">Minha Carteira</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

