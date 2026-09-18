'use client';

import { useState, useMemo } from 'react';
import { Inbox, Search, Wrench, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuoteInboxItem } from './quote-inbox-item';
import { QuoteInboxDetail } from './quote-inbox-detail';
import { useQuoteRequestList } from '../../hooks/api/query/use-quote-request-list';
import { useQuoteRequestStats } from '../../hooks/api/query/use-quote-request-stats';
import type { QuoteRequest, QuoteRequestStats, QuoteStatus } from '../../types';

interface QuoteInboxViewProps {
  initialData: { data: QuoteRequest[]; total: number };
  initialStats: QuoteRequestStats;
}

const FOLDERS: Array<{ value: QuoteStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function QuoteInboxView({ initialData, initialStats }: QuoteInboxViewProps) {
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const { data: stats } = useQuoteRequestStats();
  const currentStats = stats ?? initialStats;

  const { data } = useQuoteRequestList({
    page: 1,
    limit: 50,
    status,
    search: search.trim() ? search.trim() : undefined,
  });

  const quotes: QuoteRequest[] = data?.data ?? initialData.data;

  // Active selected quote (defaults to explicitly selected quote, or fallback to first quote in list)
  const activeSelectedId = selectedId ?? (quotes.length > 0 ? quotes[0].id : null);

  const selectedQuote = useMemo(() => {
    if (!quotes.length) return null;
    return quotes.find((q) => q.id === activeSelectedId) ?? quotes[0];
  }, [quotes, activeSelectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsMobileDetailOpen(true);
  };

  const handleDeleted = (id: string) => {
    if (activeSelectedId === id) {
      const remaining = quotes.filter((q) => q.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      setIsMobileDetailOpen(false);
    }
  };

  return (
    <div className='flex w-full flex-col gap-4'>
      {/* Top Header: Title & Status Folder Pills */}
      <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-600/20'>
            <Inbox className='size-5' />
          </div>
          <div>
            <h1 className='text-lg font-bold tracking-tight text-foreground sm:text-xl'>Quote Requests Inbox</h1>
            <p className='text-xs text-muted-foreground'>
              Customer collision, dent repair, and respray estimates received in real time.
            </p>
          </div>
        </div>

        {/* Global Stats Counter */}
        <div className='flex items-center gap-2 text-xs'>
          {currentStats.new > 0 && (
            <span className='inline-flex items-center gap-1.5 rounded-full bg-red-600/10 px-2.5 py-1 font-semibold text-red-600 dark:bg-red-600/20 dark:text-red-400'>
              <span className='size-1.5 animate-pulse rounded-full bg-red-600' />
              {currentStats.new} new
            </span>
          )}
          <span className='rounded-full border border-border px-2.5 py-1 font-medium text-muted-foreground'>
            {quotes.length} of {currentStats.all} total
          </span>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className='flex w-full [scrollbar-width:none] items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden'>
        {FOLDERS.map((folder) => {
          const isSelected = status === folder.value;
          const count = folder.value === 'all' ? currentStats.all : currentStats[folder.value];

          return (
            <Button
              key={folder.value}
              type='button'
              variant={isSelected ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => {
                setStatus(folder.value);
              }}
              className={cn(
                'h-7 shrink-0 gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-secondary font-semibold text-secondary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{folder.label}</span>
              {count !== undefined && count !== null && (
                <span
                  className={cn(
                    'py-0.2 rounded-full px-1.5 text-[10px] font-semibold',
                    folder.value === 'new' && count > 0
                      ? 'bg-red-600 text-white'
                      : isSelected
                        ? 'bg-background text-foreground'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Split-Pane Container */}
      <div className='flex h-[calc(100vh-13rem)] min-h-[580px] w-full flex-1 overflow-hidden rounded-xl border border-border/80 bg-background shadow-2xs'>
        {/* Left Pane: Inbox List */}
        <div
          className={cn(
            'flex w-full shrink-0 flex-col overflow-hidden border-border/70 lg:w-[360px] lg:border-r xl:w-[410px]',
            isMobileDetailOpen ? 'hidden lg:flex' : 'flex',
          )}
        >
          {/* Search Box */}
          <div className='border-b border-border/70 p-2.5'>
            <div className='relative flex items-center'>
              <Search className='pointer-events-none absolute left-3 size-3.5 text-muted-foreground' />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search by customer, reg plate, model...'
                className='h-8 pr-8 pl-8 text-xs'
              />
              {search && (
                <button
                  type='button'
                  onClick={() => setSearch('')}
                  className='absolute right-2.5 text-muted-foreground hover:text-foreground'
                >
                  <X className='size-3.5' />
                </button>
              )}
            </div>
          </div>

          {/* Threads List */}
          <div className='flex-1 overflow-y-auto'>
            {quotes.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground'>
                <div className='flex size-10 items-center justify-center rounded-full bg-muted/60'>
                  <Wrench className='size-4 text-muted-foreground' />
                </div>
                <p className='mt-3 text-xs font-semibold text-foreground'>No quote inquiries found</p>
                <p className='mt-1 text-[11px] text-muted-foreground'>
                  {search || status !== 'all'
                    ? 'Try clearing the search or switching filters.'
                    : 'Customer requests submitted online will appear here.'}
                </p>
              </div>
            ) : (
              <div>
                {quotes.map((quote) => (
                  <QuoteInboxItem
                    key={quote.id}
                    quote={quote}
                    isSelected={selectedQuote?.id === quote.id}
                    onSelect={() => handleSelect(quote.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Message Detail Reader */}
        <div
          className={cn(
            'flex w-full min-w-0 flex-1 flex-col overflow-hidden',
            isMobileDetailOpen ? 'flex' : 'hidden lg:flex',
          )}
        >
          {selectedQuote ? (
            <QuoteInboxDetail
              key={selectedQuote.id}
              quote={selectedQuote}
              onCloseMobile={() => setIsMobileDetailOpen(false)}
              onDeleted={handleDeleted}
            />
          ) : (
            <div className='flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground'>
              <div className='flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30'>
                <Inbox className='size-6 text-muted-foreground/60' />
              </div>
              <div className='flex max-w-sm flex-col gap-1'>
                <h3 className='text-sm font-semibold text-foreground'>Select a Quote Request</h3>
                <p className='text-xs leading-relaxed text-muted-foreground'>
                  Choose an inquiry from the inbox on the left to read full vehicle details, examine damage photos,
                  update status, and quote costs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
