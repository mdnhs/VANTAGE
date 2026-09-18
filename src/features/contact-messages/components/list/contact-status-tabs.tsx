'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContactMessageStats, ContactStatus } from '../../types';

interface ContactStatusTabsProps {
  currentStatus: ContactStatus | 'all';
  onStatusChange: (status: ContactStatus | 'all') => void;
  stats?: ContactMessageStats;
}

const TABS: Array<{ value: ContactStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Inquiries' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

export function ContactStatusTabs({ currentStatus, onStatusChange, stats }: ContactStatusTabsProps) {
  return (
    <div className='flex flex-wrap items-center gap-2 border-b border-border pb-3'>
      {TABS.map((tab) => {
        const isSelected = currentStatus === tab.value;
        const count = stats ? (tab.value === 'all' ? stats.all : stats[tab.value as keyof ContactMessageStats]) : null;

        return (
          <Button
            key={tab.value}
            variant={isSelected ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => onStatusChange(tab.value)}
            className={cn(
              'h-8 gap-2 text-xs font-medium',
              isSelected
                ? 'bg-secondary text-secondary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{tab.label}</span>
            {count !== null && (
              <span
                className={cn(
                  'py-0.2 rounded-full px-1.5 text-[10px] font-semibold',
                  tab.value === 'new' && count > 0
                    ? 'bg-red-500 text-white'
                    : isSelected
                      ? 'bg-background/80 text-foreground'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
