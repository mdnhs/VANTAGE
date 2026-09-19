'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuoteRequestStats, QuoteStatus } from '../../types';

interface QuoteStatusTabsProps {
  currentStatus: QuoteStatus | 'all';
  onStatusChange: (status: QuoteStatus | 'all') => void;
  stats?: QuoteRequestStats;
}

const TABS: Array<{ value: QuoteStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Quotes' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'waiting_response', label: 'Waiting for Response' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function QuoteStatusTabs({ currentStatus, onStatusChange, stats }: QuoteStatusTabsProps) {
  return (
    <div className='flex flex-wrap items-center gap-2 border-b border-border pb-3'>
      {TABS.map((tab) => {
        const isSelected = currentStatus === tab.value;
        const count = stats
          ? tab.value === 'all'
            ? stats.all
            : (stats[tab.value as keyof QuoteRequestStats] ?? 0)
          : null;

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
                  tab.value === 'new' && count !== undefined && count > 0
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
