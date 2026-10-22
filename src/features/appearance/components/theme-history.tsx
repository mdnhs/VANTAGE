'use client';

import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { Button } from '@/components/ui/button';

import { useThemeRevisions } from '../hooks/api/query/use-theme-revisions';

const WHEN = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Dublin',
});

export function ThemeHistory({ canRestore, onLoad }: { canRestore: boolean; onLoad(revisionId: string): void }) {
  const revisions = useThemeRevisions();
  return (
    <DashboardCard title='History'>
      {revisions.isError ? (
        <div role='alert' className='flex flex-col items-start gap-3 text-sm'>
          <p>{revisions.error.message}</p>
          <Button variant='outline' onClick={() => void revisions.refetch()}>
            Try again
          </Button>
        </div>
      ) : revisions.data?.length ? (
        <ul className='flex flex-col divide-y'>
          {revisions.data.map((rev) => (
            <li key={rev.id} className='flex flex-wrap items-center justify-between gap-3 py-2 text-sm'>
              <span className='flex flex-col'>
                <span className='font-medium'>{WHEN.format(new Date(rev.createdAt))}</span>
                <span className='text-muted-foreground'>
                  {rev.createdByName ?? 'Unknown'}
                  {rev.note ? ` · ${rev.note}` : ''}
                </span>
              </span>
              {canRestore ? (
                <Button type='button' size='sm' variant='outline' onClick={() => onLoad(rev.id)}>
                  Load into draft
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm text-muted-foreground'>{revisions.isPending ? 'Loading…' : 'Nothing published yet.'}</p>
      )}
    </DashboardCard>
  );
}
