import { Skeleton } from '@/components/ui/skeleton';
import { PIPELINE_STATUSES } from '../../types';

const CARD_COUNTS = [3, 2, 4, 2, 3, 1, 2, 1];

export function QuoteKanbanSkeleton() {
  return (
    <div className='flex h-full w-full gap-3.5 overflow-x-auto pt-1 pb-4'>
      {PIPELINE_STATUSES.map((status, colIdx) => (
        <div
          key={status}
          className='flex h-full max-w-[320px] min-w-[290px] flex-1 flex-col rounded-xl border border-border bg-muted/25'
        >
          {/* Column Header */}
          <div className='flex flex-col gap-1.5 rounded-t-xl border-b border-border/80 bg-background/50 p-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Skeleton className='size-2 rounded-full' />
                <Skeleton className='h-3 w-16' />
                <Skeleton className='size-5 rounded-full' />
              </div>
              <Skeleton className='size-6 rounded-md' />
            </div>
          </div>

          {/* Cards */}
          <div className='flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5'>
            {Array.from({ length: CARD_COUNTS[colIdx % CARD_COUNTS.length] }).map((_, cardIdx) => (
              <div key={cardIdx} className='flex flex-col gap-2.5 rounded-lg border border-border/80 bg-card p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <Skeleton className='h-4 w-16 rounded' />
                  <Skeleton className='h-2.5 w-10' />
                </div>
                <div className='flex flex-col gap-1'>
                  <Skeleton className='h-3.5 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
                <Skeleton className='h-5 w-full rounded-md' />
                <div className='flex items-center justify-between border-t border-border/50 pt-1'>
                  <Skeleton className='h-3 w-12' />
                  <Skeleton className='h-5 w-5 rounded' />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
