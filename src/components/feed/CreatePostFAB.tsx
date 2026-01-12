'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CreatePostFAB() {
  return (
    <Link href="/feed/create">
      <Button
        className={cn(
          'fixed z-50 rounded-full shadow-lg',
          'h-14 w-14 p-0',
          'bottom-24 right-4',
          'md:bottom-8 md:right-8',
          'lg:hidden',
          'hover:scale-105 active:scale-95',
          'transition-transform duration-200'
        )}
        size="icon"
        aria-label="Criar novo post"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
}

