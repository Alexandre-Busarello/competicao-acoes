import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '@/types';

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  removeTransaction: (id: string) => void;
  getTransactionsByUser: (userId: string) => Transaction[];
  reset: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };
        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));
      },
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      getTransactionsByUser: (userId) =>
        get().transactions.filter((t) => t.userId === userId),
      reset: () => set({ transactions: [] }),
    }),
    {
      name: 'competicao_transactions',
    }
  )
);

