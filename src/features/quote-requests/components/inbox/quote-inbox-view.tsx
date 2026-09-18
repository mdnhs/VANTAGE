'use client';

import { useState, useMemo } from 'react';
import {
  Archive,
  CheckCircle2,
  FileText,
  Inbox,
  PhoneForwarded,
  Search,
  Sparkles,
  Wrench,
  X,
  RefreshCw,
} from 'lucide-react';
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

const FOLDERS: Array<{
  value: QuoteStatus | 'all';
  label: string;
  icon: typeof Inbox;
}> = [
  { value: 'all', label: 'All Quotes', icon: Inbox },
  { value: 'new', label: 'New Leads', icon: Sparkles },
  { value: 'contacted', label: 'Contacted', icon: PhoneForwarded },
  { value: 'in_progress', label: 'In Progress', icon: Wrench },
  { value: 'quoted', label: 'Quoted', icon: FileText },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'archived', label: 'Archived', icon: Archive },
];

export function QuoteInboxView({ initialData, initialStats }: QuoteInboxViewProps) {
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const { data: stats, refetch: refetchStats, isFetching: isFetchingStats } = useQuoteRequestStats();
  const currentStats = stats ?? initialStats;

  const {
    data,
    refetch: refetchList,
    isFetching: isFetchingList,
  } = useQuoteRequestList({
    page: 1,
    limit: 50,
    status,
    search: search.trim() ? search.trim() : undefined,
  });

  const isRefreshing = isFetchingStats || isFetchingList;
  const handleRefresh = () => {
    void refetchStats();
    void refetchList();
  };

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
    <div className='flex h-[calc(100svh-6.5rem)] w-full flex-col gap-3.5 md:h-[calc(100svh-7.5rem)]'>
      {/* Top Header: Title & Global Counter */}
      <div className='flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-lg bg-red-600/10 text-red-600 dark:bg-red-600/20'>
            <Inbox className='size-4.5' />
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
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={handleRefresh}
            disabled={isRefreshing}
            title='Refresh'
            aria-label='Refresh inbox'
            className='size-7'
          >
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
          </Button>
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

      {/* Mobile-Only Horizontal Filter Tabs Bar (< md) */}
      <div className='flex w-full [scrollbar-width:none] items-center gap-1.5 overflow-x-auto pb-1 md:hidden [&::-webkit-scrollbar]:hidden'>
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

      {/* Split-Pane Container: 3-pane layout */}
      <div className='flex min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-border/80 bg-background shadow-2xs'>
        {/* Pane 1: Vertical Mailbox Folders (Left side on md+) */}
        <div className='hidden w-44 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/70 bg-muted/15 p-2.5 md:flex lg:w-48 xl:w-52 dark:bg-muted/10'>
          <span className='px-2.5 pt-1 pb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase'>
            Folders
          </span>
          <nav className='flex flex-col gap-1'>
            {FOLDERS.map((folder) => {
              const Icon = folder.icon;
              const isSelected = status === folder.value;
              const count = folder.value === 'all' ? currentStats.all : currentStats[folder.value];

              return (
                <button
                  key={folder.value}
                  type='button'
                  onClick={() => setStatus(folder.value)}
                  className={cn(
                    'group flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-secondary font-semibold text-secondary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <Icon
                      className={cn(
                        'size-3.5 shrink-0 transition-colors',
                        isSelected
                          ? 'text-red-600 dark:text-red-500'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    <span className='truncate'>{folder.label}</span>
                  </div>

                  {count !== undefined && count !== null && (
                    <span
                      className={cn(
                        'py-0.2 shrink-0 rounded-full px-1.5 text-[10px] font-semibold',
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pane 2: Thread List */}
        <div
          className={cn(
            'flex w-full shrink-0 flex-col overflow-hidden border-border/70 md:w-[310px] md:border-r lg:w-[350px] xl:w-[390px]',
            isMobileDetailOpen ? 'hidden md:flex' : 'flex',
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
            isMobileDetailOpen ? 'flex' : 'hidden md:flex',
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
