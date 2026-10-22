import { CardSkeleton, KpiRowSkeleton } from '@/components/admin/dashboard/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

// Dashboard pages render per request (session cookie + database reads), so without this the
// old page just freezes until the server responds. Instant skeleton on every navigation
// inside the dashboard shell — sidebar and header stay mounted around it.
export default function DashboardLoading() {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <div className='flex flex-col gap-2' aria-hidden>
        <Skeleton className='h-9 w-64 bg-skeleton' />
        <Skeleton className='h-4 w-96 max-w-full bg-skeleton' />
      </div>
      <KpiRowSkeleton />
      <CardSkeleton />
    </div>
  );
}
