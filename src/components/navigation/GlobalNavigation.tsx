'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import { UserHeader } from './UserHeader';

// Rotas onde a navegação não deve aparecer
const HIDDEN_NAV_ROUTES = [
  '/auth',
  '/checkout',
];

export function GlobalNavigation() {
  const pathname = usePathname();
  
  // Verificar se a navegação deve ser ocultada
  const shouldHideNav = HIDDEN_NAV_ROUTES.some(route => 
    pathname?.startsWith(route)
  );

  if (shouldHideNav) {
    return null;
  }

  return (
    <>
      <UserHeader />
      <BottomNav />
    </>
  );
}

// Hook para verificar se a navegação está visível (para aplicar padding)
export function useShouldShowNavigation() {
  const pathname = usePathname();
  return !HIDDEN_NAV_ROUTES.some(route => pathname?.startsWith(route));
}

