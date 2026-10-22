import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

// Lives inside the (site) layout, so the shell and section rail stay put while only the editor
// area (page header + cards) shows a skeleton.
export default function SiteContentLoading() {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <div className='flex flex-col gap-2' aria-hidden>
        <Skeleton className='h-9 w-56 bg-skeleton' />
        <Skeleton className='h-4 w-96 max-w-full bg-skeleton' />
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
