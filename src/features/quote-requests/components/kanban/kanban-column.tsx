'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'motion/react';
import { Inbox, Plus } from 'lucide-react';
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
  // A drag is under way: cards skip their enter/leave motion so dnd-kit alone moves them.
  dragging?: boolean;
}

const EASE = [0.2, 0.8, 0.2, 1] as const;

function KanbanColumnImpl({
  status,
  quotes,
  totalVal,
  onSelectQuote,
  onStatusChange,
  isOverColumn = false,
  dragging = false,
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
    <motion.div
      ref={setNodeRef}
      // The column a card is over lifts a little and glows, so the drop target is obvious.
      animate={{ y: isHighlighted ? -2 : 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn(
        'relative flex h-full max-w-[320px] min-w-[290px] flex-1 snap-start flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-[background-color,border-color,box-shadow] duration-200',
        isHighlighted ? 'border-primary/40 shadow-lg ring-2 ring-primary/30' : 'border-border/70',
      )}
    >
      {/* Status colour along the top edge */}
      <span
        aria-hidden
        className={cn('absolute inset-x-0 top-0 z-10 h-1', config.dotClassName?.replace('animate-pulse', ''))}
      />

      {/* Column header */}
      <div className='flex flex-col gap-1 border-b border-border/60 bg-card px-3.5 pt-4 pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <span className={cn('size-2 shrink-0 rounded-full', config.dotClassName)} />
            <h3 className='truncate text-sm font-semibold text-foreground'>{config.label}</h3>
            <span className='relative grid h-5 min-w-5 place-items-center overflow-hidden rounded-full bg-foreground/[0.07] px-1.5 text-[11px] font-bold text-muted-foreground tabular-nums'>
              {/* The count rolls to its new value when a card arrives or leaves. */}
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={quotes.length}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18, ease: EASE }}
                >
                  {quotes.length}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <NewEnquiryDialog
            defaultStatus={status}
            trigger={
              <button
                type='button'
                title={`Add lead in ${config.label}`}
                aria-label={`Add lead in ${config.label}`}
                className='flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              >
                <Plus className='size-4' />
              </button>
            }
          />
        </div>

        <p className='text-[11px] text-muted-foreground'>
          {totalVal > 0 ? (
            <>
              Pipeline value{' '}
              <span className='font-semibold text-foreground tabular-nums'>
                €{totalVal.toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </>
          ) : (
            'No value yet'
          )}
        </p>
      </div>

      {/* Cards */}
      <SortableContext items={quoteIds} strategy={verticalListSortingStrategy}>
        <div
          className={cn(
            'flex flex-1 flex-col gap-2.5 overflow-y-auto bg-muted/50 p-2.5 transition-colors duration-200',
            isHighlighted && 'bg-primary/[0.06]',
          )}
        >
          {quotes.length === 0 ? (
            <div
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground/80 transition-colors duration-200',
                isHighlighted && 'border-primary/60 bg-primary/10 text-primary',
              )}
            >
              <Inbox aria-hidden className='size-5 opacity-70' />
              <p>{isHighlighted ? 'Drop to move here' : 'No leads at this stage'}</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {quotes.map((quote) => (
                // A card moved by the arrow or the menu slides in at its new place; the others
                // close the gap. During a drag dnd-kit moves them, so these stay still.
                <motion.div
                  key={quote.id}
                  layout={dragging ? false : 'position'}
                  initial={dragging ? false : { opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={dragging ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                >
                  <KanbanCard quote={quote} onSelectQuote={onSelectQuote} onStatusChange={onStatusChange} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </SortableContext>
    </motion.div>
  );
}

export const KanbanColumn = memo(KanbanColumnImpl);
