'use client';

import { ArrowRightLeftIcon, PlusIcon } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { PageHeader, PRIMARY_ACTION } from '@/components/admin/dashboard/page-header';
import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { StatusPill } from '@/components/admin/dashboard/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useActor, useCan } from '@/contexts/actor-provider';
import type { RedirectDto } from '@/lib/seo/redirect-rules';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

import { REDIRECTS_PAGE_SIZE, useDeleteRedirect, useRedirects, useUpdateRedirect } from '../hooks/use-redirects';
import { PreferredAddressCard } from './preferred-address-card';
import { RedirectDialog, STATUS_LABELS, type Editing } from './redirect-dialog';

const params = {
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
};

const WHEN = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Dublin',
});

function RedirectStatus({ row }: { row: RedirectDto }) {
  return row.isActive ? <StatusPill tone='success'>Active</StatusPill> : <StatusPill tone='neutral'>Off</StatusPill>;
}

export function RedirectsView() {
  const actor = useActor();
  // View-as is read-only whatever the viewed role could do.
  const canManage = useCan({ redirect: ['manage'] }) && !actor.impersonatedBy;
  const [state, setState] = useQueryStates(params, { history: 'replace' });
  const [editing, setEditing] = useState<Editing>(null);
  const [removing, setRemoving] = useState<RedirectDto | null>(null);
  const [search, setSearch] = useState(state.q);
  const page = Math.max(1, state.page);

  const list = useRedirects({ q: state.q || undefined, page });
  const update = useUpdateRedirect();
  const remove = useDeleteRedirect();

  useEffect(() => {
    if (search === state.q) return;
    const timer = setTimeout(() => void setState({ q: search.trim(), page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [search, state.q, setState]);

  // ?page=999 lands on the last page rather than an empty one.
  const total = list.data?.total;
  const lastPage = total === undefined ? undefined : Math.max(1, Math.ceil(total / REDIRECTS_PAGE_SIZE));
  useEffect(() => {
    if (lastPage !== undefined && page > lastPage) void setState({ page: lastPage });
  }, [lastPage, page, setState]);

  function toggle(row: RedirectDto) {
    update.mutate(
      { id: row.id, patch: { isActive: !row.isActive } },
      {
        onSuccess: (saved) => toast.success(saved.isActive ? 'Redirect on' : 'Redirect off'),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  const actions = (row: RedirectDto) => (
    <div className='flex flex-wrap gap-1'>
      <Button variant='ghost' size='sm' aria-label={`Edit ${row.sourcePath}`} onClick={() => setEditing(row)}>
        Edit
      </Button>
      <Button
        variant='ghost'
        size='sm'
        aria-label={`${row.isActive ? 'Turn off' : 'Turn on'} ${row.sourcePath}`}
        disabled={update.isPending}
        onClick={() => toggle(row)}
      >
        {row.isActive ? 'Turn off' : 'Turn on'}
      </Button>
      <Button variant='ghost' size='sm' aria-label={`Delete ${row.sourcePath}`} onClick={() => setRemoving(row)}>
        Delete
      </Button>
    </div>
  );

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Redirects'
        description='Send old addresses to the right page.'
        actions={
          canManage ? (
            <Button className={cn(PRIMARY_ACTION)} onClick={() => setEditing('new')}>
              <PlusIcon aria-hidden />
              New redirect
            </Button>
          ) : null
        }
      />
      <PreferredAddressCard />
      <Input
        type='search'
        aria-label='Search redirects'
        placeholder='Search addresses'
        className='w-full sm:w-72'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {list.isPending ? (
        <CardSkeleton />
      ) : list.isError ? (
        <EmptyState
          title="Redirects didn't load"
          description={list.error.message}
          action={<Button onClick={() => list.refetch()}>Try again</Button>}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeftIcon}
          title='No redirects yet'
          description='Add one when a page moves or an old link should land somewhere new.'
        />
      ) : (
        <>
          <div
            aria-busy={list.isFetching || undefined}
            className={cn('overflow-x-auto rounded-lg border', list.isFetching && 'opacity-70')}
          >
            <Table>
              <TableCaption className='sr-only'>Redirects</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hits</TableHead>
                  <TableHead>Last hit</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? (
                    <TableHead>
                      <span className='sr-only'>Actions</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='font-mono text-xs break-all whitespace-normal'>{row.sourcePath}</TableCell>
                    <TableCell className='font-mono text-xs break-all whitespace-normal'>{row.destination}</TableCell>
                    <TableCell>{STATUS_LABELS[row.statusCode] ?? row.statusCode}</TableCell>
                    <TableCell className='tabular-nums'>{row.hitCount.toLocaleString('en-IE')}</TableCell>
                    <TableCell>
                      {row.lastHitAt ? (
                        <time dateTime={row.lastHitAt} className='whitespace-nowrap tabular-nums'>
                          {WHEN.format(new Date(row.lastHitAt))}
                        </time>
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell>
                      <RedirectStatus row={row} />
                    </TableCell>
                    {canManage ? <TableCell>{actions(row)}</TableCell> : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <span>
              Page {page} of {lastPage} ({list.data.total} redirects)
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => void setState({ page: page - 1 }, { history: 'push' })}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={lastPage === undefined || page >= lastPage}
                onClick={() => void setState({ page: page + 1 }, { history: 'push' })}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      {canManage ? <RedirectDialog editing={editing} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={removing !== null && canManage}
        title='Delete this redirect?'
        description={
          <>
            {removing?.sourcePath} will stop sending visitors to {removing?.destination}. This can&apos;t be undone.
          </>
        }
        confirmLabel='Delete'
        pending={remove.isPending}
        error={remove.error?.message}
        onClose={() => {
          setRemoving(null);
          remove.reset();
        }}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success('Redirect deleted');
              setRemoving(null);
            },
          })
        }
      />
    </div>
  );
}
