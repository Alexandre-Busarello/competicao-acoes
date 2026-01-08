'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils/currency';
import type { Transaction } from '@/types';

// Mapeamento de números de mês para nomes em português
const monthNames = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

interface UserTransactionListProps {
  userId: string;
  isPremium?: boolean;
}

interface GroupedTransactions {
  [monthKey: string]: {
    [dayKey: string]: Transaction[];
  };
}

export function UserTransactionList({ userId, isPremium = false }: UserTransactionListProps) {
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

  // Filtrar apenas transações do ano atual
  const currentYearTransactions = useMemo(() => {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    
    return transactions.filter((transaction) => {
      return isWithinInterval(transaction.date, { start: yearStart, end: yearEnd });
    });
  }, [transactions]);

  // Agrupar transações por mês e dia
  const groupedTransactions = useMemo(() => {
    const sorted = [...currentYearTransactions].sort((a, b) => b.date.getTime() - a.date.getTime());
    const grouped: GroupedTransactions = {};

    sorted.forEach((transaction) => {
      const monthKey = format(transaction.date, 'yyyy-MM');
      const dayKey = format(transaction.date, 'yyyy-MM-dd');

      if (!grouped[monthKey]) {
        grouped[monthKey] = {};
      }
      if (!grouped[monthKey][dayKey]) {
        grouped[monthKey][dayKey] = [];
      }
      grouped[monthKey][dayKey].push(transaction);
    });

    return grouped;
  }, [currentYearTransactions]);

  // Obter meses ordenados (mais recentes primeiro) e definir tab inicial
  const monthKeys = useMemo(() => {
    return Object.keys(groupedTransactions).sort((a, b) => {
      return new Date(b + '-01').getTime() - new Date(a + '-01').getTime();
    });
  }, [groupedTransactions]);

  const [activeTab, setActiveTab] = useState<string>('');

  // Atualizar tab ativa quando os meses mudarem
  useEffect(() => {
    if (monthKeys.length > 0 && (!activeTab || !monthKeys.includes(activeTab))) {
      setActiveTab(monthKeys[0]);
    }
  }, [monthKeys, activeTab]);

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Carregando transações...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentYearTransactions.length === 0) {
    return (
      <div className="px-4 py-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma transação registrada no ano atual.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (monthKeys.length === 0) {
    return (
      <div className="px-4 py-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma transação registrada ainda.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não há tab ativa ainda, não renderizar
  if (!activeTab || monthKeys.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-4">Histórico de Transações</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
          {monthKeys.map((monthKey) => {
            // Extrair o número do mês diretamente do monthKey (formato: "yyyy-MM")
            const monthNumber = parseInt(monthKey.split('-')[1], 10) - 1; // -1 porque array é 0-indexed
            const monthName = monthNames[monthNumber];
            const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            
            return (
              <TabsTrigger key={monthKey} value={monthKey} className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                {monthNameCapitalized}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {monthKeys.map((monthKey) => {
          // Obter dias do mês ordenados (mais recentes primeiro)
          const dayKeys = Object.keys(groupedTransactions[monthKey]).sort((a, b) => {
            return new Date(b).getTime() - new Date(a).getTime();
          });

          return (
            <TabsContent key={monthKey} value={monthKey} className="mt-4">
              <div className="space-y-4">
                {dayKeys.map((dayKey) => {
                  const dayTransactions = groupedTransactions[monthKey][dayKey];
                  const dayDate = new Date(dayKey);
                  const dayName = format(dayDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
                  const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                  return (
                    <div key={dayKey} className="space-y-2">
                      {/* Cabeçalho do dia */}
                      <div className="px-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {dayNameCapitalized}
                        </h4>
                      </div>

                      {/* Lista de transações do dia */}
                      <div className="space-y-2">
                        {dayTransactions.map((transaction) => {
                          const isCompra = transaction.type === 'compra';
                          return (
                            <Card 
                              key={transaction.id}
                              className={`relative overflow-hidden ${
                                !isPremium ? 'blur-sm' : ''
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    {isCompra ? (
                                      <ArrowUpCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <ArrowDownCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold">{transaction.ticker}</span>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            isCompra
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                          }`}
                                        >
                                          {isCompra ? 'Compra' : 'Venda'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {transaction.quantity} unidades × {formatPrice(transaction.price, transaction.ticker)}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {format(transaction.createdAt, "HH:mm", { locale: ptBR })}h
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">
                                        {formatPrice(transaction.quantity * transaction.price, transaction.ticker)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

