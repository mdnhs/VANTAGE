'use client';

import { DownloadIcon, HistoryIcon } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { PageHeader, SECONDARY_ACTION } from '@/components/admin/dashboard/page-header';
import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { useAuditFacets } from '../hooks/api/query/use-audit-facets';
import { useAuditList } from '../hooks/api/query/use-audit-list';
import type { AuditRow } from '../types';
import { activityParsers, exportHref, toAuditParams, toDay } from '../utils/params';
import { ActivityDetail } from './activity-detail';

const ALL = '__all__';
const MIN_DAY = '1900-01-01';
const MAX_DAY = '2100-12-31';

const WHEN = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Dublin',
});

// An empty or unparseable input (a date field can hold a six-digit year) clears the filter
// instead of putting an Invalid Date into the state.
function parseDay(value: string) {
  const date = new Date(value);
  return value && toDay(date) ? date : null;
}

const who = (row: AuditRow) => row.actorName ?? row.actorEmail ?? 'System';
const whoLabel = (row: AuditRow) =>
  row.impersonatorName ? `${row.impersonatorName} (viewing as ${who(row)})` : who(row);

function DetailsButton({ row, onOpen }: { row: AuditRow; onOpen: (id: string) => void }) {
  return (
    <Button variant='ghost' size='sm' onClick={() => onOpen(row.id)} aria-label={`Details of ${row.summary}`}>
      {row.hasDiff ? 'Changes' : 'Details'}
    </Button>
  );
}

type FilterSelectProps = {
  id: string;
  label: string;
  className: string;
  items: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
};

function FilterSelect({ id, label, className, items, value, onChange }: FilterSelectProps) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : String(next))}>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function ActivityView() {
  const [state, setState] = useQueryStates(activityParsers, { history: 'replace' });
  const params = toAuditParams(state);
  const list = useAuditList(params);
  const facets = useAuditFacets();
  const [detail, setDetail] = useState<string | null>(null);

  // ?page=999 lands on the last page rather than an empty one.
  const total = list.data?.total;
  const lastPage = total === undefined ? undefined : Math.max(1, Math.ceil(total / params.pageSize));
  useEffect(() => {
    if (lastPage !== undefined && params.page > lastPage) void setState({ page: lastPage });
  }, [lastPage, params.page, setState]);

  // Any filter change starts again from page 1.
  const filter = (values: Partial<typeof state>) => void setState({ ...values, page: 1 });
  // Paging pushes history so Back steps through pages; filters replace.
  const goTo = (page: number) => void setState({ page }, { history: 'push' });

  const actionItems = [
    { value: ALL, label: 'All actions' },
    ...(facets.data?.actions ?? []).map((a) => ({ value: a, label: a })),
  ];
  const entityItems = [
    { value: ALL, label: 'All entities' },
    ...(facets.data?.entityTypes ?? []).map((t) => ({ value: t, label: t })),
  ];
  const actorItems = [
    { value: ALL, label: 'Everyone' },
    ...(facets.data?.actors ?? []).map((a) => ({ value: a.id, label: a.label })),
  ];

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Activity log'
        description='Who changed what, and when. Times are Irish time.'
        actions={
          <a
            href={exportHref(params)}
            download
            className={cn(buttonVariants({ variant: 'outline' }), SECONDARY_ACTION)}
          >
            <DownloadIcon aria-hidden />
            Export CSV
          </a>
        }
      />
      <div role='group' aria-label='Filters' className='flex flex-wrap items-end gap-3'>
        <FilterSelect
          id='activity-action'
          label='Action'
          className='w-full sm:w-56'
          items={actionItems}
          value={params.action ?? null}
          onChange={(action) => filter({ action })}
        />
        <FilterSelect
          id='activity-entity'
          label='Entity'
          className='w-full sm:w-48'
          items={entityItems}
          value={params.entityType ?? null}
          onChange={(entityType) => filter({ entityType })}
        />
        <FilterSelect
          id='activity-actor'
          label='Person'
          className='w-full sm:w-64'
          items={actorItems}
          value={params.actor ?? null}
          onChange={(actor) => filter({ actor })}
        />
        <Field className='w-[calc(50%-0.375rem)] sm:w-44'>
          <FieldLabel htmlFor='activity-from'>From</FieldLabel>
          <Input
            id='activity-from'
            type='date'
            value={params.from ?? ''}
            min={MIN_DAY}
            max={params.to ?? MAX_DAY}
            onChange={(event) => filter({ from: parseDay(event.target.value) })}
          />
        </Field>
        <Field className='w-[calc(50%-0.375rem)] sm:w-44'>
          <FieldLabel htmlFor='activity-to'>To</FieldLabel>
          <Input
            id='activity-to'
            type='date'
            value={params.to ?? ''}
            min={params.from ?? MIN_DAY}
            max={MAX_DAY}
            onChange={(event) => filter({ to: parseDay(event.target.value) })}
          />
        </Field>
        <Button
          variant='ghost'
          className='h-9'
          onClick={() => filter({ action: null, entityType: null, actor: null, from: null, to: null })}
        >
          Reset filters
        </Button>
      </div>
      {list.isPending ? (
        <CardSkeleton />
      ) : list.isError ? (
        <EmptyState
          title="The activity log didn't load"
          description={list.error.message}
          action={<Button onClick={() => list.refetch()}>Try again</Button>}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title='Nothing matches these filters'
          description='Try a wider date range or reset the filters.'
        />
      ) : (
        <>
          <div
            aria-busy={list.isFetching || undefined}
            className={cn('overflow-x-auto rounded-lg border', list.isFetching && 'opacity-70')}
          >
            <Table>
              <TableCaption className='sr-only'>Activity log</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <time dateTime={row.createdAt} className='whitespace-nowrap tabular-nums'>
                        {WHEN.format(new Date(row.createdAt))}
                      </time>
                    </TableCell>
                    <TableCell>{whoLabel(row)}</TableCell>
                    <TableCell>
                      <code className='font-mono text-xs'>{row.action}</code>
                    </TableCell>
                    <TableCell className='whitespace-normal'>{row.summary}</TableCell>
                    <TableCell>
                      <DetailsButton row={row} onOpen={setDetail} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <span>
              Page {params.page} of {lastPage} ({list.data.total} entries)
            </span>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' disabled={params.page <= 1} onClick={() => goTo(params.page - 1)}>
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={lastPage === undefined || params.page >= lastPage}
                onClick={() => goTo(params.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      <ActivityDetail id={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
