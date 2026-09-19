'use client';

import { useState } from 'react';
import {
  Car,
  Clock,
  ImageIcon,
  MoreHorizontal,
  Plus,
  ChevronRight,
  UserCheck2,
  CalendarClock,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PIPELINE_STATUSES, type PipelineStatus, type QuoteRequest, type QuoteStatus } from '../../types';
import { STATUS_CONFIG } from '../quote-status-badge';
import { QuoteSourceBadge } from '../quote-source-badge';
import { NewEnquiryDialog } from '../inbox/new-enquiry-dialog';
import { cn } from '@/lib/utils';

interface QuoteKanbanViewProps {
  quotes: QuoteRequest[];
  onSelectQuote: (id: string) => void;
  onStatusChange: (id: string, newStatus: QuoteStatus) => Promise<void>;
  isUpdating?: boolean;
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

export function QuoteKanbanView({ quotes, onSelectQuote, onStatusChange }: QuoteKanbanViewProps) {
  const [draggedQuoteId, setDraggedQuoteId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PipelineStatus | null>(null);

  // Group quotes by canonical pipeline status
  const columnsData = PIPELINE_STATUSES.map((status) => {
    const columnQuotes = quotes.filter((q) => normalizeStatus(q.status) === status);
    const totalVal = columnQuotes.reduce((sum, q) => {
      const val = q.estimatedCost ? parseFloat(q.estimatedCost) : 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      status,
      config: STATUS_CONFIG[status],
      quotes: columnQuotes,
      totalVal,
    };
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedQuoteId(id);
  };

  const handleDragEnd = () => {
    setDraggedQuoteId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: PipelineStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: PipelineStatus) => {
    // Only clear if leaving the column element entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: PipelineStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const quoteId = e.dataTransfer.getData('text/plain') || draggedQuoteId;
    if (!quoteId) return;

    const currentQuote = quotes.find((q) => q.id === quoteId);
    if (currentQuote && normalizeStatus(currentQuote.status) !== targetStatus) {
      await onStatusChange(quoteId, targetStatus);
    }
    setDraggedQuoteId(null);
  };

  return (
    <div className='flex h-full w-full gap-3.5 overflow-x-auto pt-1 pb-4'>
      {columnsData.map(({ status, config, quotes: colQuotes, totalVal }) => {
        const isDropTarget = dragOverColumn === status;

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={(e) => handleDragLeave(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            className={cn(
              'flex h-full max-w-[320px] min-w-[290px] flex-1 flex-col rounded-xl border bg-muted/25 transition-colors',
              config.borderClassName ? `border-t-2 ${config.borderClassName}` : 'border-border',
              isDropTarget && 'border-primary/50 bg-primary/5 ring-2 ring-primary/40',
            )}
          >
            {/* Column Header */}
            <div className='flex flex-col gap-1.5 rounded-t-xl border-b border-border/80 bg-background/50 p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className={cn('size-2 rounded-full', config.dotClassName)} />
                  <h3 className='text-xs font-semibold tracking-wider text-foreground uppercase'>{config.label}</h3>
                  <span className='flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground'>
                    {colQuotes.length}
                  </span>
                </div>

                <NewEnquiryDialog
                  defaultStatus={status}
                  trigger={
                    <button
                      type='button'
                      title={`Add lead in ${config.label}`}
                      className='flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                    >
                      <Plus className='size-3.5' />
                    </button>
                  }
                />
              </div>

              {/* Column Value Summary */}
              {totalVal > 0 && (
                <div className='flex items-center gap-1 text-[11px] font-medium text-muted-foreground'>
                  <span>Pipeline value:</span>
                  <span className='font-semibold text-foreground'>
                    €{totalVal.toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
            </div>

            {/* Cards Container */}
            <div className='flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5'>
              {colQuotes.length === 0 ? (
                <div
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground/70 transition-all',
                    isDropTarget && 'border-primary/60 bg-primary/10 text-primary',
                  )}
                >
                  <p>Drop cards here</p>
                </div>
              ) : (
                colQuotes.map((quote) => {
                  const isBeingDragged = draggedQuoteId === quote.id;
                  const hasPhotos = Boolean(quote.photoUrls && quote.photoUrls.length > 0);
                  const vehicleText = [quote.year, quote.make, quote.model].filter(Boolean).join(' ');

                  // Determine next logical pipeline stage for quick advance
                  const currentIdx = PIPELINE_STATUSES.indexOf(normalizeStatus(quote.status));
                  const nextStatus =
                    currentIdx >= 0 && currentIdx < PIPELINE_STATUSES.length - 1
                      ? PIPELINE_STATUSES[currentIdx + 1]
                      : null;

                  return (
                    <div
                      key={quote.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, quote.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelectQuote(quote.id)}
                      className={cn(
                        'group relative flex cursor-grab flex-col gap-2.5 rounded-lg border border-border/80 bg-card p-3 shadow-xs transition-all hover:border-border hover:shadow-md active:cursor-grabbing',
                        isBeingDragged && 'scale-95 border-dashed border-primary opacity-40',
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
                        {quote.serviceType && (
                          <p className='mt-0.5 line-clamp-1 text-xs text-muted-foreground'>{quote.serviceType}</p>
                        )}
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
                          {quote.paymentStatus === 'unpaid' &&
                            ['approved', 'in_progress', 'completed'].includes(normalizeStatus(quote.status)) && (
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

                        {/* Quick Status Menu */}
                        <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
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
                              <DropdownMenuLabel className='text-[11px] font-semibold text-muted-foreground uppercase'>
                                Move pipeline stage
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {PIPELINE_STATUSES.map((st) => (
                                <DropdownMenuItem
                                  key={st}
                                  disabled={normalizeStatus(quote.status) === st}
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
