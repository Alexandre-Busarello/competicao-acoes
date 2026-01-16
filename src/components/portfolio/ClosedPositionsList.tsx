'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Transaction } from '@/types';
import { formatPrice } from '@/lib/utils/currency';
import { normalizeTickerForGrouping } from '@/lib/utils/portfolio-calculator';
import { determineAssetType, getAssetName, getETFCategory } from '@/lib/utils/asset-type';
import { getCategoryDisplayName } from '@/lib/data/etfs';
import type { AssetType, ETFCategory } from '@/types';

interface ClosedPosition {
  ticker: string;
  name: string;
  type: AssetType;
  etfCategory?: ETFCategory;
  totalInvested: number;
  totalReceived: number;
  return: number;
  returnPercentage: number;
}

interface ClosedPositionsListProps {
  userId: string;
  isPremium?: boolean;
  isOwner?: boolean;
  hasActivePositions?: boolean;
  portfolioLength?: number; // Quantidade de ativos na carteira
}

export function ClosedPositionsList({ userId, isPremium = false, isOwner = false, hasActivePositions = false, portfolioLength = 0 }: ClosedPositionsListProps) {
  const canView = isPremium || isOwner;
  // Se há apenas 1 ativo ou carteira zerada e usuário não é premium/owner, mostrar com blur
  const shouldShowWithBlur = !canView && (portfolioLength <= 1);
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      const response = await fetch(`/api/transactions/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Erro ao buscar transações');
      }

      const data = await response.json();
      return data.transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.createdAt),
      }));
    },
    staleTime: 30 * 1000, // 30 segundos
  });

  const closedPositions = useMemo(() => {
    if (!transactions.length) return [];

    // Agrupar transações por ticker normalizado
    const tickerMap = new Map<string, Transaction[]>();
    
    transactions.forEach((tx) => {
      const normalizedTicker = normalizeTickerForGrouping(tx.ticker);
      const existing = tickerMap.get(normalizedTicker) || [];
      tickerMap.set(normalizedTicker, [...existing, tx]);
    });

    const closed: ClosedPosition[] = [];

    // Para cada ticker, verificar se foi completamente vendido
    for (const [ticker, tickerTransactions] of tickerMap.entries()) {
      // Calcular quantidade atual (compras - vendas)
      let currentQuantity = 0;
      let totalInvested = 0;
      let totalReceived = 0;

      for (const tx of tickerTransactions) {
        if (tx.type === 'compra') {
          currentQuantity += tx.quantity;
          totalInvested += tx.quantity * tx.price;
        } else {
          currentQuantity -= tx.quantity;
          totalReceived += tx.quantity * tx.price;
        }
      }

      // Se quantidade atual é zero ou negativa e houve compras, é uma posição encerrada
      if (currentQuantity <= 0 && totalInvested > 0) {
        const returnValue = totalReceived - totalInvested;
        const returnPercentage = totalInvested > 0 
          ? ((returnValue / totalInvested) * 100) 
          : 0;

        // Determinar tipo e nome do ativo
        const assetType = determineAssetType(ticker);
        const assetName = getAssetName(ticker);
        const etfCategory = assetType === 'etf' ? getETFCategory(ticker) : undefined;

        closed.push({
          ticker,
          name: assetName,
          type: assetType,
          etfCategory,
          totalInvested,
          totalReceived,
          return: returnValue,
          returnPercentage: Number(returnPercentage.toFixed(2)),
        });
      }
    }

    // Ordenar por rentabilidade (maior primeiro)
    return closed.sort((a, b) => b.returnPercentage - a.returnPercentage);
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não há posições encerradas e não deve mostrar com blur, não exibir
  if (closedPositions.length === 0 && !shouldShowWithBlur) {
    return null;
  }

  // Se deve mostrar com blur mas não há posições reais, criar posições mockadas
  // Se há posições reais mas deve mostrar com blur, usar as posições reais mas com blur
  const positionsToShow = shouldShowWithBlur && closedPositions.length === 0
    ? [
        {
          ticker: 'ATIVO1',
          name: 'Ativo Encerrado',
          type: 'acao' as AssetType,
          totalInvested: 10000,
          totalReceived: 12000,
          return: 2000,
          returnPercentage: 20,
        },
        {
          ticker: 'ATIVO2',
          name: 'Ativo Encerrado',
          type: 'acao' as AssetType,
          totalInvested: 5000,
          totalReceived: 4500,
          return: -500,
          returnPercentage: -10,
        },
      ]
    : closedPositions;
  
  // Se há apenas 1 ativo ou carteira zerada e não pode visualizar, sempre aplicar blur
  const shouldApplyBlur = !canView && (portfolioLength <= 1);

  return (
    <div className="container mx-auto px-4 py-4">
      <h2 className="text-lg font-semibold mb-4">Ativos Encerrados</h2>
      <div className="space-y-3 mb-6">
        {positionsToShow.map((position, index) => {
          const isPositive = position.returnPercentage >= 0;
          const ReturnIcon = isPositive ? TrendingUp : TrendingDown;
          const isMocked = shouldShowWithBlur && closedPositions.length === 0;

          return (
            <Card 
              key={position.ticker + index}
              className={`relative overflow-hidden ${
                shouldApplyBlur || !canView ? 'blur-sm' : ''
              }`}
            >
              <CardContent className="p-4">
                {isMocked && !canView && (
                  <div className="mb-2 p-2 bg-muted/50 rounded-md border border-dashed border-muted-foreground/30">
                    <p className="text-xs text-muted-foreground text-center">
                      <strong>Posições encerradas simuladas:</strong> Torne-se Membro Pro para visualizar todas as posições encerradas do portfólio.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{position.ticker}</span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        {position.type === 'acao'
                          ? 'Ação'
                          : position.type === 'fii'
                          ? 'FII'
                          : position.type === 'etf'
                          ? position.etfCategory
                            ? getCategoryDisplayName(position.etfCategory)
                            : 'ETF'
                          : position.type === 'renda-fixa'
                          ? 'RF'
                          : position.type === 'cripto'
                          ? 'Cripto'
                          : 'Outros'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {position.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Investido: {canView ? formatPrice(position.totalInvested, position.ticker) : '•••'} • 
                      Recebido: {canView ? formatPrice(position.totalReceived, position.ticker) : '•••'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 font-semibold ${
                      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      <ReturnIcon className="h-4 w-4" />
                      <span>
                        {canView 
                          ? `${isPositive ? '+' : ''}${position.returnPercentage.toFixed(2)}%`
                          : '•••%'}
                      </span>
                    </div>
                    <div className={`text-sm ${
                      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {canView ? formatPrice(position.return, position.ticker) : '•••'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA para adicionar novas posições - apenas quando não há posições ativas */}
      {isOwner && !hasActivePositions && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Comece uma Nova Estratégia
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione novas posições à sua carteira e continue competindo no ranking.
            </p>
            <Link href="/minha-carteira">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Posições
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


