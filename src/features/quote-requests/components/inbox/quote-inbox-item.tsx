'use client';

import { cn } from '@/lib/utils';
import { Camera, Car } from 'lucide-react';
import { QuoteStatusBadge } from '../quote-status-badge';
import { QuoteSourceBadge } from '../quote-source-badge';
import { formatRelativeTime, formatServiceType, getAvatarColor, getInitials } from './quote-inbox-formatters';
import type { QuoteRequest } from '../../types';

interface QuoteInboxItemProps {
  quote: QuoteRequest;
  isSelected: boolean;
  onSelect: () => void;
}

export function QuoteInboxItem({ quote, isSelected, onSelect }: QuoteInboxItemProps) {
  const isNew = quote.status === 'new';
  const vehicleName = [quote.year, quote.make, quote.model].filter(Boolean).join(' ');
  const photoCount = quote.photoUrls?.length ?? 0;

  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-start gap-3 border-b border-border/60 p-3.5 text-left transition-all duration-150',
        isSelected
          ? 'bg-accent/80 text-foreground dark:bg-muted/70'
          : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
      )}
    >
      {/* Active selection left bar */}
      {isSelected && <span className='absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-red-600' />}

      {/* Customer Avatar */}
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tracking-tight shadow-2xs transition-transform group-hover:scale-105',
          getAvatarColor(quote.name),
        )}
      >
        {getInitials(quote.name)}
      </div>

      {/* Main Info */}
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        {/* Top row: Customer Name + Unread Indicator + Date */}
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-1.5'>
            {isNew && (
              <span className='size-2 shrink-0 rounded-full bg-red-600 ring-2 ring-red-600/20' title='New inquiry' />
            )}
            <span
              className={cn(
                'truncate text-xs',
                isNew || isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground/90',
              )}
            >
              {quote.name}
            </span>
          </div>

          <span className='shrink-0 font-mono text-[11px] text-muted-foreground/80'>
            {formatRelativeTime(quote.createdAt)}
          </span>
        </div>

        {/* Vehicle & Plate Bar */}
        <div className='flex min-w-0 items-center gap-1.5 text-xs text-foreground/80'>
          {quote.registration ? (
            <span className='py-0.2 inline-flex shrink-0 items-center rounded border border-neutral-300 bg-amber-400 px-1 font-mono text-[10px] font-bold text-black uppercase shadow-2xs'>
              {quote.registration}
            </span>
          ) : (
            <Car className='size-3 shrink-0 text-muted-foreground' />
          )}
          <span className='truncate text-[11px] font-medium text-foreground/80'>
            {vehicleName || 'Vehicle unspecified'}
          </span>
        </div>

        {/* Snippet / Service Description */}
        <p className='line-clamp-1 text-[11px] leading-normal text-muted-foreground'>
          <span className='font-medium text-foreground/75'>{formatServiceType(quote.serviceType)}: </span>
          {quote.description || 'No additional description provided.'}
        </p>

        {/* Bottom Badges */}
        <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
          <QuoteStatusBadge status={quote.status} />
          <QuoteSourceBadge source={quote.source} />

          {photoCount > 0 && (
            <span className='inline-flex items-center gap-1 rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
              <Camera className='size-2.5' />
              <span>{photoCount}</span>
            </span>
          )}

          {quote.estimatedCost && (
            <span className='inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
              €
              {parseFloat(quote.estimatedCost).toLocaleString('en-IE', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
