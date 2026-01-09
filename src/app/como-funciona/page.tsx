'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/navigation/PageHeader';
import { TrendingUp, DollarSign, Calendar, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Como Funciona" 
        backHref="/ranking"
      />

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
                    Adicione suas compras e vendas de ativos através da tela &quot;Minha Carteira&quot;. 
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
                  <p className="text-sm text-muted-foreground mb-2">
                    Sua rentabilidade é calculada comparando o valor atual da sua carteira (baseado nos 
                    preços de mercado) com o valor total investido. A fórmula é simples:
                  </p>
                  <div className="mt-2 p-3 bg-muted rounded-md mb-3">
                    <code className="text-sm">
                      Rentabilidade = ((Valor Atual - Valor Investido) / Valor Investido) × 100%
                    </code>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">Como funciona com vendas e encerramento de posições:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Valor Investido:</strong> Soma apenas das compras realizadas (não inclui vendas)</li>
                      <li><strong>Valor Atual:</strong> Soma do valor atual das posições em carteira + dinheiro recebido em vendas</li>
                      <li><strong>Vendas:</strong> Quando você vende ações, o dinheiro recebido é incluído no valor atual da carteira</li>
                      <li><strong>Encerramento de posições:</strong> Quando você vende todas as ações de um ativo, o dinheiro recebido continua contando para o valor atual</li>
                    </ul>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Exemplo prático:</p>
                      <p className="text-blue-800 dark:text-blue-200 text-xs">
                        Você compra 100 ações de PETR4 a R$ 30,00 (investiu R$ 3.000,00). 
                        Depois vende 50 ações a R$ 35,00 (recebeu R$ 1.750,00). 
                        As 50 ações restantes valem R$ 1.750,00 (a preço atual de mercado). 
                        Valor atual = R$ 1.750,00 (posições) + R$ 1.750,00 (vendas) = R$ 3.500,00. 
                        Rentabilidade = ((R$ 3.500,00 - R$ 3.000,00) / R$ 3.000,00) × 100% = +16,67%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Posicionamento no Ranking</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Os participantes são ordenados por rentabilidade (do maior para o menor). 
                    Quanto maior sua rentabilidade percentual, melhor sua posição. A quantidade investida 
                    não importa - apenas a rentabilidade proporcional é considerada.
                  </p>
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-800">
                    <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Critério de Desempate:</p>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                      Quando dois ou mais participantes têm a mesma rentabilidade (ou muito próxima), 
                      o sistema usa os seguintes critérios de desempate, nesta ordem:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-purple-800 dark:text-purple-200 ml-2">
                      <li>
                        <strong>Número de ativos:</strong> Quem tem mais ativos diferentes na carteira ganha
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 ml-4">
                          <strong>Motivo:</strong> Incentiva a diversificação da carteira, uma prática fundamental de investimento. 
                          Uma carteira diversificada é geralmente mais resiliente e demonstra conhecimento sobre diferentes setores e ativos.
                        </p>
                      </li>
                      <li>
                        <strong>Última transação:</strong> Se ainda houver empate, quem lançou transações há menos tempo ganha
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 ml-4">
                          <strong>Motivo:</strong> Valoriza a atividade recente e o engajamento contínuo com a plataforma. 
                          Participantes ativos demonstram maior interesse e dedicação à competição.
                        </p>
                      </li>
                      <li>
                        <strong>Data de criação da conta:</strong> Se ainda houver empate, quem tem a conta há mais tempo ganha
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 ml-4">
                          <strong>Motivo:</strong> Reconhece a fidelidade e o comprometimento de longo prazo dos participantes. 
                          Usuários que estão na plataforma há mais tempo demonstram consistência e dedicação contínua à competição.
                        </p>
                      </li>
                    </ol>
                    <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-300 dark:border-purple-700">
                      <p className="text-xs text-purple-800 dark:text-purple-200 font-semibold mb-1">Exemplo prático:</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        Dois participantes têm +10,00% de rentabilidade e ambos têm 3 ativos. 
                        O participante A lançou sua última transação há 2 horas, enquanto o participante B lançou há 1 hora. 
                        O participante B fica à frente porque tem atividade mais recente. 
                        Se ambos tivessem lançado transações no mesmo momento, quem tem a conta criada há mais tempo ficaria à frente.
                      </p>
                    </div>
                  </div>
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

        {/* Regras de Reset e Premiação */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Regras de Reset e Premiação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Ranking Mensal</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Rentabilidade resetada mensalmente:</strong> No primeiro dia de cada mês, 
                    a rentabilidade é resetada automaticamente. Isso significa que cada mês é uma nova competição.
                  </p>
                  <p>
                    <strong className="text-foreground">Considera apenas operações do mês:</strong> A rentabilidade mensal considera 
                    apenas as transações realizadas dentro do mês específico. Transações de meses anteriores não são consideradas 
                    no cálculo da rentabilidade mensal.
                  </p>
                  <p>
                    <strong className="text-foreground">Premiação:</strong> A premiação não acontece exatamente no reset do mês. 
                    Nossa equipe analisa os resultados e entra em contato com os vencedores após análise completa dos dados.
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-lg">Ranking Anual</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Considera todas as transações do ano:</strong> A rentabilidade anual considera 
                    todas as transações realizadas dentro do ano específico, desde o primeiro dia do ano até a data atual (ou data de corte).
                  </p>
                  <p>
                    <strong className="text-foreground">Retorno acumulado:</strong> O ranking anual mostra o retorno acumulado de todos 
                    os meses do ano. É a soma de todas as operações realizadas durante o ano, não uma projeção anualizada.
                  </p>
                  <p>
                    <strong className="text-foreground">Data de encerramento flexível:</strong> O ranking anual não necessariamente encerra 
                    apenas no fim do ano. Nossa equipe pode decidir encerrar antes e criar uma data de corte específica. Os participantes 
                    serão informados sobre qualquer mudança na data de encerramento.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualização de Períodos Anteriores */}
        <Card>
          <CardHeader>
            <CardTitle>Visualização de Períodos Anteriores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Você pode visualizar rankings e carteiras de períodos anteriores usando os seletores de mês e ano disponíveis 
                nas páginas de ranking e carteira (disponível para usuários premium).
              </p>
              <div>
                <h3 className="font-semibold mb-2">URLs Compartilháveis</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Cada visualização de período tem uma URL única que pode ser compartilhada:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Ranking mensal: <code className="bg-muted px-1 rounded">/ranking/mensal/2025/02</code></li>
                  <li>Ranking anual: <code className="bg-muted px-1 rounded">/ranking/anual/2025</code></li>
                  <li>Carteira mensal: <code className="bg-muted px-1 rounded">/carteira/[id]/mensal/2025/02</code></li>
                  <li>Carteira anual: <code className="bg-muted px-1 rounded">/carteira/[id]/anual/2025</code></li>
                </ul>
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

