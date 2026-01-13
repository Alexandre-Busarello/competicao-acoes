'use client';

import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedFilterDropdownProps {
  value: 'global' | 'interactions' | 'myPosts';
  onValueChange: (value: 'global' | 'interactions' | 'myPosts') => void;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  showText?: boolean; // Força exibição do texto mesmo no mobile
}

const filterLabels: Record<'global' | 'interactions' | 'myPosts', string> = {
  global: 'Feed Global',
  interactions: 'Posts que Interagi',
  myPosts: 'Meus Posts',
};

export function FeedFilterDropdown({
  value,
  onValueChange,
  variant = 'ghost',
  size = 'icon',
  showText = false,
}: FeedFilterDropdownProps) {
  const selectedLabel = filterLabels[value];
  const isIconOnly = size === 'icon' && !showText;
  const shouldShowText = showText || !isIconOnly;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={isIconOnly ? 'icon' : 'sm'} 
          aria-label="Filtrar feed"
          className={shouldShowText ? 'gap-2' : ''}
        >
          <Filter className="h-4 w-4" />
          {shouldShowText && (
            <>
              <span>{selectedLabel}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup 
          value={value} 
          onValueChange={(val) => {
            if (val === 'global' || val === 'interactions' || val === 'myPosts') {
              onValueChange(val);
            }
          }}
        >
          <DropdownMenuRadioItem value="global">
            Feed Global
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="interactions">
            Posts que Interagi
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="myPosts">
            Meus Posts
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

