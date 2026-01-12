'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string | ReactNode;
  backHref?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  leftAction?: ReactNode; // Para ações no lado esquerdo (mobile)
  className?: string;
}

export function PageHeader({ 
  title, 
  backHref, 
  onBack,
  rightAction,
  leftAction,
  className = ''
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={`sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border flex-shrink-0 ${className}`}>
      <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-4xl">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBack}
          className="flex-shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-lg font-semibold flex-1 truncate">
          {typeof title === 'string' ? <h1>{title}</h1> : title}
        </div>
        {/* Action para mobile (lado direito do header) */}
        {leftAction && <div className="flex-shrink-0 lg:hidden">{leftAction}</div>}
        {/* Action para desktop (lado direito do header) */}
        {rightAction && <div className="flex-shrink-0 hidden lg:flex items-center gap-2">{rightAction}</div>}
      </div>
    </div>
  );
}

