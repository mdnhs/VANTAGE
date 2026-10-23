'use client';

import Link from 'next/link';
import { ArrowRight, Car, Clock, Inbox } from 'lucide-react';
import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { QuoteStatusBadge } from '@/features/quote-requests/components/quote-status-badge';
import { QuoteSourceBadge } from '@/features/quote-requests/components/quote-source-badge';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { QuoteRequest } from '@/server/db/schema';

interface RecentActivityFeedProps {
  leads: QuoteRequest[];
}

function formatRelativeTime(dateStr: string | Date): string {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });
}

export function RecentActivityFeed({ leads }: RecentActivityFeedProps) {
  return (
    <DashboardCard
      title='Recent Customer Enquiries'
      className='flex h-full flex-col'
      action={
        <Link
          href={APP_ROUTES.leads.quotes.index}
          className='flex items-center gap-1 text-xs font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400'
        >
          <span>Open Pipeline</span>
          <ArrowRight className='size-3' />
        </Link>
      }
    >
      <p className='-mt-3 text-xs text-muted-foreground'>Latest incoming leads across all workshop intake channels</p>
      <div className='-mx-5 flex flex-1 flex-col sm:-mx-6'>
        {leads.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground'>
            <Inbox className='mb-2 size-8 text-muted-foreground/50' />
            <p className='text-xs font-medium'>No inquiries logged yet</p>
          </div>
        ) : (
          <div className='flex-1 divide-y divide-border/60 overflow-y-auto outline-none'>
            {leads.map((lead) => {
              const vehicleText = [lead.year, lead.make, lead.model].filter(Boolean).join(' ');

              return (
                <div key={lead.id} className='flex flex-col gap-2 p-3.5 transition-colors hover:bg-muted/30'>
                  {/* Top row: Customer name & source on left, status & price on right */}
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <h4 className='truncate text-xs font-semibold text-foreground'>{lead.name}</h4>
                      <QuoteSourceBadge source={lead.source} />
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <QuoteStatusBadge status={lead.status} />
                      {lead.estimatedCost ? (
                        <span className='font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400'>
                          €{parseFloat(lead.estimatedCost).toLocaleString('en-IE', { minimumFractionDigits: 0 })}
                        </span>
                      ) : (
                        <span className='text-[11px] text-muted-foreground/60 italic'>Unpriced</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Vehicle & service info on left, time on right */}
                  <div className='flex items-center justify-between gap-2 text-xs'>
                    <div className='flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground'>
                      {lead.registration || vehicleText ? (
                        <div className='flex items-center gap-1.5 rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px]'>
                          <Car className='size-3 shrink-0 text-muted-foreground' />
                          {lead.registration && (
                            <span className='font-bold tracking-wider whitespace-nowrap text-red-600 uppercase dark:text-red-400'>
                              {lead.registration}
                            </span>
                          )}
                          {lead.registration && vehicleText && <span>•</span>}
                          {vehicleText && <span className='truncate text-foreground/80'>{vehicleText}</span>}
                        </div>
                      ) : (
                        <span className='truncate'>{lead.serviceType || 'Standard Collision Repair'}</span>
                      )}
                    </div>

                    <span className='flex shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground/80'>
                      <Clock className='size-2.5' />
                      {formatRelativeTime(lead.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
