import { Skeleton } from '@/components/ui/skeleton';

// Page title + description placeholder shared by every dashboard skeleton.
function HeaderSkeleton() {
  return (
    <div className='flex items-center justify-between gap-4'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-4 w-72 max-w-full' />
      </div>
      <Skeleton className='h-9 w-28' />
    </div>
  );
}

// Form-style page: a few cards of labelled inputs (site pages, settings).
export function FormPageSkeleton() {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <HeaderSkeleton />
      {[0, 1].map((card) => (
        <div key={card} className='flex flex-col gap-4 rounded-xl border border-border p-6'>
          <Skeleton className='h-5 w-40' />
          <div className='grid gap-4 sm:grid-cols-2'>
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className='flex flex-col gap-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-9 w-full' />
              </div>
            ))}
          </div>
          <Skeleton className='h-20 w-full' />
        </div>
      ))}
    </div>
  );
}

// List page: header + table rows (services, projects, quotes, contacts, admins).
export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <HeaderSkeleton />
      <div className='overflow-hidden rounded-lg border border-border'>
        <Skeleton className='h-10 w-full rounded-none' />
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className='flex items-center gap-4 border-t border-border px-4 py-3'>
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-5 flex-1' />
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-5 w-12' />
          </div>
        ))}
      </div>
    </div>
  );
}
