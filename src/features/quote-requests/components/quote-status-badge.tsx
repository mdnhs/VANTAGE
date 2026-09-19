import { cn } from '@/lib/utils';
import type { QuoteStatus } from '../types';

export const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; className: string; dotClassName?: string; borderClassName?: string }
> = {
  new: {
    label: 'New',
    className: 'bg-rose-500/10 text-rose-500 border-rose-500/25',
    dotClassName: 'bg-rose-500 animate-pulse',
    borderClassName: 'border-t-rose-500',
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/25 dark:text-blue-400',
    dotClassName: 'bg-blue-500',
    borderClassName: 'border-t-blue-500',
  },
  waiting_response: {
    label: 'Waiting for Response',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
    dotClassName: 'bg-amber-500',
    borderClassName: 'border-t-amber-500',
  },
  quote_sent: {
    label: 'Quote Sent',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400',
    dotClassName: 'bg-purple-500',
    borderClassName: 'border-t-purple-500',
  },
  approved: {
    label: 'Approved',
    className: 'bg-teal-500/10 text-teal-600 border-teal-500/25 dark:text-teal-400',
    dotClassName: 'bg-teal-500',
    borderClassName: 'border-t-teal-500',
  },
  in_progress: {
    label: 'Work in Progress',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/25 dark:text-indigo-400',
    dotClassName: 'bg-indigo-500',
    borderClassName: 'border-t-indigo-500',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
    dotClassName: 'bg-emerald-500',
    borderClassName: 'border-t-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/25 dark:text-zinc-400',
    dotClassName: 'bg-zinc-500',
    borderClassName: 'border-t-zinc-500',
  },
  // Legacy aliases
  quoted: {
    label: 'Quote Sent',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400',
    dotClassName: 'bg-purple-500',
    borderClassName: 'border-t-purple-500',
  },
  archived: {
    label: 'Cancelled',
    className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/25 dark:text-zinc-400',
    dotClassName: 'bg-zinc-500',
    borderClassName: 'border-t-zinc-500',
  },
};

export function QuoteStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status as QuoteStatus] ?? {
    label: status.replace(/_/g, ' '),
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.dotClassName && <span className={cn('size-1.5 shrink-0 rounded-full', config.dotClassName)} />}
      <span className='truncate'>{config.label}</span>
    </span>
  );
}
