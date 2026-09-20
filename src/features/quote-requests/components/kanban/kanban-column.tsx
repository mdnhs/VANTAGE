'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanCard } from './kanban-card';
import { NewEnquiryDialog } from '../inbox/new-enquiry-dialog';
import { type PipelineStatus, type QuoteRequest, type QuoteStatus } from '../../types';
import { STATUS_CONFIG } from '../quote-status-badge';
import { cn } from '@/lib/utils';

export interface KanbanColumnProps {
  status: PipelineStatus;
  quotes: QuoteRequest[];
  totalVal: number;
  onSelectQuote: (id: string) => void;
  onStatusChange: (id: string, newStatus: QuoteStatus) => Promise<void>;
  isOverColumn?: boolean;
}

function KanbanColumnImpl({
  status,
  quotes,
  totalVal,
  onSelectQuote,
  onStatusChange,
  isOverColumn = false,
}: KanbanColumnProps) {
  const config = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'column',
      status,
    },
  });

  const isHighlighted = isOver || isOverColumn;
  const quoteIds = quotes.map((q) => q.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full max-w-[320px] min-w-[290px] flex-1 flex-col rounded-xl border bg-muted/25 transition-colors',
        config.borderClassName ? `border-t-2 ${config.borderClassName}` : 'border-border',
        isHighlighted && 'border-primary/50 bg-primary/5 ring-2 ring-primary/40',
      )}
    >
      {/* Column Header */}
      <div className='flex flex-col gap-1.5 rounded-t-xl border-b border-border/80 bg-background/50 p-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className={cn('size-2 rounded-full', config.dotClassName)} />
            <h3 className='text-xs font-semibold tracking-wider text-foreground uppercase'>{config.label}</h3>
            <span className='flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground'>
              {quotes.length}
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

      {/* Cards Container with SortableContext */}
      <SortableContext items={quoteIds} strategy={verticalListSortingStrategy}>
        <div className='flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5'>
          {quotes.length === 0 ? (
            <div
              className={cn(
                'flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground/70 transition-colors duration-150',
                isHighlighted && 'border-primary/60 bg-primary/10 text-primary',
              )}
            >
              <p>Drop cards here</p>
            </div>
          ) : (
            quotes.map((quote) => (
              <KanbanCard key={quote.id} quote={quote} onSelectQuote={onSelectQuote} onStatusChange={onStatusChange} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export const KanbanColumn = memo(KanbanColumnImpl);
