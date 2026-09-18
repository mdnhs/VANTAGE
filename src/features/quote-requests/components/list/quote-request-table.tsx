'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, MessageSquare, Phone, Trash2, Search, Wrench } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { QuoteStatusBadge } from '../quote-status-badge';
import { QuoteStatusTabs } from './quote-status-tabs';
import { useQuoteRequestList } from '../../hooks/api/query/use-quote-request-list';
import { useQuoteRequestStats } from '../../hooks/api/query/use-quote-request-stats';
import { useUpdateQuoteRequest } from '../../hooks/api/mutation/use-update-quote-request';
import { useDeleteQuoteRequest } from '../../hooks/api/mutation/use-delete-quote-request';
import { QUOTE_STATUSES, type QuoteRequest, type QuoteRequestStats, type QuoteStatus } from '../../types';

interface QuoteRequestTableProps {
  initialData: { data: QuoteRequest[]; total: number };
  initialStats: QuoteRequestStats;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusQuickSelect({ quote }: { quote: QuoteRequest }) {
  const updateQuote = useUpdateQuoteRequest(quote.id);

  return (
    <Select
      value={quote.status}
      disabled={updateQuote.isPending}
      onValueChange={(val) => updateQuote.mutate({ status: val as QuoteStatus })}
    >
      <SelectTrigger className='h-7 w-[125px] text-xs'>
        <SelectValue>
          <QuoteStatusBadge status={quote.status} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {QUOTE_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className='text-xs'>
            <QuoteStatusBadge status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function QuoteRequestTable({ initialData, initialStats }: QuoteRequestTableProps) {
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: stats } = useQuoteRequestStats();
  const { data } = useQuoteRequestList({
    page,
    limit,
    status,
    search: search ? search : undefined,
  });

  const rows = data?.data ?? initialData.data;
  const total = data?.pagination?.total ?? initialData.total;
  const currentStats = stats ?? initialStats;

  const deleteQuote = useDeleteQuoteRequest();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete quote request from "${name}"? This cannot be undone.`)) {
      setPendingDeleteId(id);
      deleteQuote.mutate(id, { onSettled: () => setPendingDeleteId(null) });
    }
  };

  return (
    <div className='flex flex-col gap-5'>
      {/* Top Filter Tabs */}
      <QuoteStatusTabs
        currentStatus={status}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        stats={currentStats}
      />

      {/* Search Bar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative w-full max-w-sm'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder='Search name, reg plate, phone, email...'
            className='pl-9 text-xs'
          />
        </div>
        <span className='text-xs text-muted-foreground'>
          Showing {rows.length} of {total} {total === 1 ? 'quote' : 'quotes'}
        </span>
      </div>

      {/* Table Container */}
      {rows.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <Wrench className='size-5' />
          </div>
          <h3 className='mt-3 text-sm font-semibold'>No quote requests found</h3>
          <p className='mt-1 text-xs text-muted-foreground'>
            {search || status !== 'all'
              ? 'Try adjusting your search or status filter.'
              : 'New quote inquiries submitted by visitors will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg border border-border'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground'>
                <th className='px-4 py-3'>Customer</th>
                <th className='px-4 py-3'>Vehicle Info</th>
                <th className='px-4 py-3'>Service / Damage</th>
                <th className='px-4 py-3'>Date Received</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {rows.map((quote) => {
                const phoneDigits = quote.phone.replace(/[^\d+]/g, '');
                return (
                  <tr key={quote.id} className='transition-colors hover:bg-muted/30'>
                    {/* Customer */}
                    <td className='px-4 py-3'>
                      <div className='flex flex-col'>
                        <span className='font-medium text-foreground'>{quote.name}</span>
                        <span className='text-xs text-muted-foreground'>{quote.phone}</span>
                        <span className='max-w-[180px] truncate text-xs text-muted-foreground'>{quote.email}</span>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className='px-4 py-3'>
                      <div className='flex flex-col gap-1'>
                        {quote.registration ? (
                          <span className='inline-block w-fit rounded border border-neutral-300 bg-amber-400/90 px-1.5 py-0.5 font-mono text-[11px] font-bold text-black uppercase shadow-2xs'>
                            {quote.registration}
                          </span>
                        ) : (
                          <span className='text-xs text-muted-foreground italic'>No reg provided</span>
                        )}
                        <span className='text-xs text-foreground'>
                          {[quote.year, quote.make, quote.model].filter(Boolean).join(' ') || 'Vehicle unspecified'}
                        </span>
                      </div>
                    </td>

                    {/* Service */}
                    <td className='px-4 py-3'>
                      <div className='flex max-w-xs flex-col gap-0.5'>
                        <span className='text-xs font-medium text-foreground'>
                          {quote.serviceType || 'General Bodywork'}
                        </span>
                        {quote.description ? (
                          <span className='line-clamp-2 text-xs text-muted-foreground'>{quote.description}</span>
                        ) : (
                          <span className='text-xs text-muted-foreground italic'>No description</span>
                        )}
                        {quote.photoUrls && quote.photoUrls.length > 0 && (
                          <span className='mt-1 inline-flex w-fit items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
                            📷 {quote.photoUrls.length} {quote.photoUrls.length === 1 ? 'photo' : 'photos'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className='px-4 py-3 text-xs whitespace-nowrap text-muted-foreground'>
                      {formatDate(quote.createdAt)}
                    </td>

                    {/* Status */}
                    <td className='px-4 py-3'>
                      <StatusQuickSelect quote={quote} />
                    </td>

                    {/* Actions */}
                    <td className='px-4 py-3 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${phoneDigits.replace('+', '')}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          title='Chat on WhatsApp'
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                            'size-8 text-emerald-500 hover:text-emerald-400',
                          )}
                        >
                          <MessageSquare className='size-4' />
                        </a>

                        {/* Call */}
                        <a
                          href={`tel:${phoneDigits}`}
                          title='Call customer'
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                            'size-8 text-blue-500 hover:text-blue-400',
                          )}
                        >
                          <Phone className='size-4' />
                        </a>

                        {/* View Details */}
                        <Link
                          href={APP_ROUTES.leads.quotes.details(quote.id)}
                          title='View details & quote'
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
                        >
                          <Eye className='size-4' />
                        </Link>

                        {/* Delete */}
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          title='Delete quote request'
                          disabled={pendingDeleteId === quote.id}
                          onClick={() => handleDelete(quote.id, quote.name)}
                          className='size-8 text-destructive hover:text-destructive'
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
