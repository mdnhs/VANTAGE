import { cn } from '@/lib/utils';
import type { QuoteStatus } from '../types';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string; dotClassName?: string }> = {
  new: {
    label: 'New Lead',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    dotClassName: 'bg-red-500 animate-pulse',
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dotClassName: 'bg-blue-400',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotClassName: 'bg-amber-400',
  },
  quoted: {
    label: 'Quoted',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    dotClassName: 'bg-purple-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotClassName: 'bg-emerald-400',
  },
  archived: {
    label: 'Archived',
    className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    dotClassName: 'bg-zinc-500',
  },
};

export function QuoteStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status as QuoteStatus] ?? {
    label: status,
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
      {config.dotClassName && <span className={cn('size-1.5 rounded-full', config.dotClassName)} />}
      {config.label}
    </span>
  );
}
