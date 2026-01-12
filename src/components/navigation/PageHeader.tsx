'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string | ReactNode;
  backHref?: string; // Mantido para compatibilidade, mas não usado
  onBack?: () => void; // Mantido para compatibilidade, mas não usado
  rightAction?: ReactNode;
  leftAction?: ReactNode; // Para ações no lado esquerdo (mobile)
  className?: string;
}

export function PageHeader({ 
  title, 
  rightAction,
  leftAction,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border flex-shrink-0 ${className}`}>
      <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-4xl">
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

