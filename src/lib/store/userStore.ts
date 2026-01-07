import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  updatePremiumStatus: (isPremium: boolean) => void;
  reset: () => void;
}

const defaultUser: User = {
  id: 'current-user',
  name: 'Alexandre Busarello',
  isPremium: false,
  rank: 45,
  monthlyReturn: 8.5,
  portfolio: [],
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: defaultUser,
      setUser: (user) => set({ user }),
      updatePremiumStatus: (isPremium) =>
        set((state) => ({
          user: state.user ? { ...state.user, isPremium } : null,
        })),
      reset: () => set({ user: defaultUser }),
    }),
    {
      name: 'competicao_user',
    }
  )
);

