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
  value: 'global' | 'interactions';
  onValueChange: (value: 'global' | 'interactions') => void;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

const filterLabels: Record<'global' | 'interactions', string> = {
  global: 'Feed Global',
  interactions: 'Posts que Interagi',
};

export function FeedFilterDropdown({
  value,
  onValueChange,
  variant = 'ghost',
  size = 'icon',
}: FeedFilterDropdownProps) {
  const selectedLabel = filterLabels[value];
  const isIconOnly = size === 'icon';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={isIconOnly ? 'icon' : 'sm'} 
          aria-label="Filtrar feed"
          className={!isIconOnly ? 'gap-2' : ''}
        >
          <Filter className="h-4 w-4" />
          {!isIconOnly && (
            <>
              <span className="hidden sm:inline">{selectedLabel}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          <DropdownMenuRadioItem value="global">
            Feed Global
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="interactions">
            Posts que Interagi
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

