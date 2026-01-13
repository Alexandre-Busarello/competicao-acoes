'use client';

import { GlobalNavigation, useShouldShowNavigation } from './GlobalNavigation';

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const shouldShowNav = useShouldShowNavigation();
  
  return (
    <>
      <GlobalNavigation />
      <main className={shouldShowNav ? 'pb-16 md:pb-0' : ''}>
        {children}
      </main>
    </>
  );
}




