'use client';

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Car, Clock, ImageIcon, MoreHorizontal, ChevronRight, UserCheck2, CalendarClock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PIPELINE_STATUSES, type PipelineStatus, type QuoteRequest, type QuoteStatus } from '../../types';
import { STATUS_CONFIG } from '../quote-status-badge';
import { QuoteSourceBadge } from '../quote-source-badge';
import { cn } from '@/lib/utils';

export interface KanbanCardProps {
  quote: QuoteRequest;
  onSelectQuote?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: QuoteStatus) => Promise<void>;
  isOverlay?: boolean;
}

function formatRelativeTime(dateStr: string | Date): string {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });
}

function normalizeStatus(rawStatus: string): PipelineStatus {
  if (rawStatus === 'quoted') return 'quote_sent';
  if (rawStatus === 'archived') return 'cancelled';
  if (PIPELINE_STATUSES.includes(rawStatus as PipelineStatus)) {
    return rawStatus as PipelineStatus;
  }
  return 'new';
}

function KanbanCardImpl({ quote, onSelectQuote, onStatusChange, isOverlay = false }: KanbanCardProps) {
  const status = normalizeStatus(quote.status);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: quote.id,
    data: {
      type: 'card',
      quote,
      status,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const hasPhotos = Boolean(quote.photoUrls && quote.photoUrls.length > 0);
  const vehicleText = [quote.year, quote.make, quote.model].filter(Boolean).join(' ');

  // Determine next logical pipeline stage for quick advance
  const currentIdx = PIPELINE_STATUSES.indexOf(status);
  const nextStatus =
    currentIdx >= 0 && currentIdx < PIPELINE_STATUSES.length - 1 ? PIPELINE_STATUSES[currentIdx + 1] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging && onSelectQuote) {
          onSelectQuote(quote.id);
        }
      }}
      className={cn(
        'group relative flex cursor-grab touch-none flex-col gap-2.5 rounded-lg border border-border/80 bg-card p-3 font-sans text-foreground shadow-2xs select-none active:cursor-grabbing',
        'transition-[border-color,background-color,box-shadow,opacity] duration-150',
        !isOverlay && 'hover:border-border hover:shadow-md',
        isDragging && 'border-2 border-dashed border-primary/50 bg-primary/5 opacity-25 shadow-none',
        isOverlay &&
          'pointer-events-none w-[285px] scale-[1.02] rotate-1 cursor-grabbing border-primary/60 bg-card shadow-2xl ring-2 ring-primary/40 sm:w-[295px]',
      )}
    >
      {/* Card Header: Source & Time */}
      <div className='flex items-center justify-between gap-2'>
        <QuoteSourceBadge source={quote.source} />
        <span className='flex items-center gap-1 text-[10px] text-muted-foreground'>
          <Clock className='size-2.5' />
          {formatRelativeTime(quote.createdAt)}
        </span>
      </div>

      {/* Customer Name & Service */}
      <div>
        <h4 className='text-sm leading-tight font-semibold text-foreground transition-colors group-hover:text-red-600'>
          {quote.name}
        </h4>
        {quote.serviceType && <p className='mt-0.5 line-clamp-1 text-xs text-muted-foreground'>{quote.serviceType}</p>}
      </div>

      {/* Vehicle Badge */}
      {(vehicleText || quote.registration) && (
        <div className='flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 font-mono text-[11px] text-foreground'>
          <Car className='size-3 shrink-0 text-muted-foreground' />
          {quote.registration && (
            <span className='font-bold tracking-wider text-red-600 uppercase dark:text-red-400'>
              {quote.registration}
            </span>
          )}
          {quote.registration && vehicleText && <span>•</span>}
          {vehicleText && <span className='truncate'>{vehicleText}</span>}
        </div>
      )}

      {/* Phase 3 Meta: Location, Assigned Staff & Inspection */}
      {(quote.city || quote.assignedAdmin || quote.inspectionDate) && (
        <div className='flex flex-wrap items-center gap-1.5 pt-0.5'>
          {quote.city && (
            <span className='inline-flex items-center gap-1 text-[10px] text-muted-foreground'>
              <MapPin className='size-2.5 shrink-0 text-blue-500' />
              <span>{quote.city}</span>
            </span>
          )}
          {quote.assignedAdmin && (
            <span className='inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400'>
              <UserCheck2 className='size-2.5' />
              <span>{quote.assignedAdmin.name.split(' ')[0]}</span>
            </span>
          )}
          {quote.inspectionDate && (
            <span
              title={`Inspection: ${new Date(quote.inspectionDate).toLocaleString('en-IE')}`}
              className='inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400'
            >
              <CalendarClock className='size-2.5' />
              <span>
                {new Date(quote.inspectionDate).toLocaleDateString('en-IE', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Card Footer: Pricing, Payment Status, Photos count & Actions */}
      <div className='flex items-center justify-between border-t border-border/50 pt-1 text-xs'>
        <div className='flex items-center gap-1.5'>
          {quote.estimatedCost ? (
            <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
              €{parseFloat(quote.estimatedCost).toLocaleString('en-IE', { minimumFractionDigits: 0 })}
            </span>
          ) : (
            <span className='text-[11px] text-muted-foreground/60 italic'>Unpriced</span>
          )}

          {/* Payment Status Pill */}
          {quote.paymentStatus === 'paid_in_full' && (
            <span className='rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-emerald-600 uppercase dark:text-emerald-400'>
              Paid
            </span>
          )}
          {quote.paymentStatus === 'partially_paid' && (
            <span className='rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-amber-600 uppercase dark:text-amber-400'>
              Partial
            </span>
          )}
          {quote.paymentStatus === 'unpaid' && ['approved', 'in_progress', 'completed'].includes(status) && (
            <span className='rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-red-500 uppercase'>
              Unpaid
            </span>
          )}

          {hasPhotos && (
            <span
              title={`${quote.photoUrls?.length} damage photos`}
              className='ml-1 flex items-center gap-1 text-[10px] text-muted-foreground'
            >
              <ImageIcon className='size-3' />
              {quote.photoUrls?.length}
            </span>
          )}
        </div>

        {/* Quick Status Menu - stops propagation so clicking does not trigger drag or open sheet */}
        {!isOverlay && onStatusChange && (
          <div
            className='flex items-center gap-1'
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {nextStatus && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-6 text-muted-foreground hover:bg-muted hover:text-foreground'
                title={`Advance to ${STATUS_CONFIG[nextStatus]?.label}`}
                onClick={() => void onStatusChange(quote.id, nextStatus)}
              >
                <ChevronRight className='size-3.5' />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-6 text-muted-foreground hover:bg-muted hover:text-foreground'
                  >
                    <MoreHorizontal className='size-3.5' />
                  </Button>
                }
              />
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='text-[11px] font-semibold text-muted-foreground uppercase'>
                    Move pipeline stage
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {PIPELINE_STATUSES.map((st) => (
                  <DropdownMenuItem
                    key={st}
                    disabled={status === st}
                    onClick={() => void onStatusChange(quote.id, st)}
                    className='gap-2 text-xs'
                  >
                    <span className={cn('size-2 rounded-full', STATUS_CONFIG[st]?.dotClassName)} />
                    <span>{STATUS_CONFIG[st]?.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

export const KanbanCard = memo(KanbanCardImpl);
