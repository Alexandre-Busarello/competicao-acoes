'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScrollToTopButtonProps {
  containerRef: React.RefObject<HTMLElement>;
  className?: string;
}

export function ScrollToTopButton({ containerRef, className }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Mostrar botão quando scrollar mais de 300px do topo
      const scrollTop = container.scrollTop;
      setIsVisible(scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Verificar estado inicial

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  const scrollToTop = () => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        'fixed z-[60] rounded-full shadow-lg', // z-index maior que o FAB (z-50)
        'h-12 w-12 p-0',
        'bottom-40 right-4', // Mobile: acima do FAB que está em bottom-24 (24 + 16 = 40)
        'md:bottom-24 md:right-8', // Desktop: acima do FAB que está em bottom-8 (8 + 16 = 24)
        'hover:scale-105 active:scale-95',
        'transition-all duration-200',
        'animate-in fade-in slide-in-from-bottom-4',
        className
      )}
      size="icon"
      aria-label="Voltar ao topo"
      variant="default"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}

