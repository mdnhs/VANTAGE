import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// bg-skeleton, not the default bg-muted: muted is nearly the panel's own
// grey, so the placeholders vanished on it in both themes.
// The KPI row's columns: two from the small breakpoint, and as many as there
// are cards (up to four) on wide screens.
export const kpiGridClass = (count: number) =>
  cn('grid gap-4 sm:grid-cols-2', count > 3 ? 'xl:grid-cols-4' : count === 3 ? 'xl:grid-cols-3' : '');

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={kpiGridClass(count)} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className='h-[164px] rounded-card bg-skeleton' />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton aria-hidden className={cn('h-72 rounded-card bg-skeleton', className)} />;
}
