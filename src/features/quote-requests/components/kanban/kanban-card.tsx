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

// "crash-repair" -> "Crash repair": the slug the forms store, as a person would write it.
function serviceLabel(slug: string) {
  const words = slug.replace(/[-_]+/g, ' ').trim();
  return words ? words[0]!.toUpperCase() + words.slice(1) : slug;
}

// An Irish number plate: the blue IRL band, then the registration.
function RegPlate({ reg }: { reg: string }) {
  return (
    <span className='inline-flex h-5 shrink-0 items-stretch overflow-hidden rounded-[4px] border border-foreground/15 bg-white text-[11px] font-bold tracking-wider text-neutral-900 uppercase shadow-2xs'>
      <span className='flex items-center bg-blue-700 px-1 text-[7px] font-semibold tracking-normal text-white'>
        IRL
      </span>
      <span className='flex items-center px-1.5 font-mono'>{reg}</span>
    </span>
  );
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

  const hasPhotos = quote.photos.length > 0;
  const vehicleText = [quote.year, quote.make, quote.model].filter(Boolean).join(' ');

  // Determine next logical pipeline stage for quick advance
  const currentIdx = PIPELINE_STATUSES.indexOf(status);
  const nextStatus =
    currentIdx >= 0 && currentIdx < PIPELINE_STATUSES.length - 1 ? PIPELINE_STATUSES[currentIdx + 1] : null;

  // The slot a dragged card leaves behind: a dashed outline of the same size, so the column
  // shows where it will land.
  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className='rounded-xl border-2 border-dashed border-primary/45 bg-primary/[0.06]'
      >
        <div className='invisible p-3.5'>
          <CardBody quote={quote} status={status} hasPhotos={hasPhotos} vehicleText={vehicleText} />
        </div>
      </div>
    );
  }

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
        'group relative flex cursor-grab touch-none flex-col gap-3 rounded-xl border border-border/70 bg-card p-3.5 font-sans text-foreground shadow-xs select-none active:cursor-grabbing',
        'transition-[border-color,box-shadow,translate] duration-200 ease-out',
        !isOverlay && 'hover:-translate-y-0.5 hover:border-border hover:shadow-md',
        isOverlay && 'pointer-events-none w-[285px] cursor-grabbing border-primary/40 bg-card sm:w-[295px]',
      )}
    >
      <CardBody quote={quote} status={status} hasPhotos={hasPhotos} vehicleText={vehicleText} />

      {/* Quick Status Menu - stops propagation so clicking does not trigger drag or open sheet */}
      {!isOverlay && onStatusChange && (
        <div
          className='absolute right-2.5 bottom-2.5 flex items-center gap-0.5 rounded-lg bg-card/90 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100'
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatus && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
              title={`Advance to ${STATUS_CONFIG[nextStatus]?.label}`}
              aria-label={`Advance to ${STATUS_CONFIG[nextStatus]?.label}`}
              onClick={() => void onStatusChange(quote.id, nextStatus)}
            >
              <ChevronRight className='size-4' />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Move pipeline stage'
                  className='size-7 text-muted-foreground hover:bg-muted hover:text-foreground'
                >
                  <MoreHorizontal className='size-4' />
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
  );
}

function CardBody({
  quote,
  status,
  hasPhotos,
  vehicleText,
}: {
  quote: QuoteRequest;
  status: PipelineStatus;
  hasPhotos: boolean;
  vehicleText: string;
}) {
  return (
    <>
      {/* Source and age */}
      <div className='flex items-center justify-between gap-2'>
        <QuoteSourceBadge source={quote.source} />
        <span className='flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums'>
          <Clock className='size-3' />
          {formatRelativeTime(quote.createdAt)}
        </span>
      </div>

      {/* Customer and service */}
      <div className='flex flex-col gap-0.5'>
        <h4 className='text-[15px] leading-tight font-semibold text-foreground transition-colors group-hover:text-primary'>
          {quote.name}
        </h4>
        {quote.serviceType && (
          <p className='line-clamp-1 text-xs text-muted-foreground'>{serviceLabel(quote.serviceType)}</p>
        )}
      </div>

      {/* Vehicle */}
      {(vehicleText || quote.registration) && (
        <div className='flex min-w-0 items-center gap-2 text-xs'>
          {quote.registration ? (
            <RegPlate reg={quote.registration} />
          ) : (
            <Car className='size-3.5 shrink-0 text-muted-foreground' />
          )}
          {vehicleText && <span className='truncate text-muted-foreground'>{vehicleText}</span>}
        </div>
      )}

      {/* Location, assignee and inspection */}
      {(quote.city || quote.assignedUser || quote.inspectionDate) && (
        <div className='flex flex-wrap items-center gap-1.5'>
          {quote.city && (
            <span className='inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground'>
              <MapPin className='size-3 shrink-0' />
              <span>{quote.city}</span>
            </span>
          )}
          {quote.assignedUser && (
            <span className='inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-400'>
              <UserCheck2 className='size-3' />
              <span>{quote.assignedUser.name.split(' ')[0]}</span>
            </span>
          )}
          {quote.inspectionDate && (
            <span
              title={`Inspection: ${new Date(quote.inspectionDate).toLocaleString('en-IE')}`}
              className='inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400'
            >
              <CalendarClock className='size-3' />
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

      {/* Price, payment and photos (the actions sit over the right end) */}
      <div className='flex min-h-7 items-center gap-1.5 border-t border-border/60 pt-2.5 pr-16 text-xs'>
        {quote.estimatedCost ? (
          <span className='font-semibold text-emerald-600 tabular-nums dark:text-emerald-400'>
            €{parseFloat(quote.estimatedCost).toLocaleString('en-IE', { minimumFractionDigits: 0 })}
          </span>
        ) : (
          <span className='text-[11px] text-muted-foreground/70 italic'>Unpriced</span>
        )}

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
            title={`${quote.photos.length} damage photos`}
            className='ml-1 flex items-center gap-1 text-[11px] text-muted-foreground'
          >
            <ImageIcon className='size-3' />
            {quote.photos.length}
          </span>
        )}
      </div>
    </>
  );
}

export const KanbanCard = memo(KanbanCardImpl);
