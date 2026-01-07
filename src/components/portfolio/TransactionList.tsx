'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useTransactionStore } from '@/lib/store/transactionStore';
import { useUserStore } from '@/lib/store/userStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPrice, isUSDCurrency } from '@/lib/utils/currency';

export function TransactionList() {
  const { user } = useUserStore();
  const { getTransactionsByUser } = useTransactionStore();

  if (!user) return null;

  const transactions = getTransactionsByUser(user.id);

  if (transactions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma transação registrada ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use o botão + para adicionar sua primeira transação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <h2 className="text-lg font-semibold mb-4">Histórico de Transações</h2>
      <div className="space-y-3">
        {transactions
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .map((transaction) => {
            const isCompra = transaction.type === 'compra';
            return (
              <Card key={transaction.id}>
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
                          {format(transaction.date, "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
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
}

