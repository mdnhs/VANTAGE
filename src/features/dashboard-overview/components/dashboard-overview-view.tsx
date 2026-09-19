'use client';

import Link from 'next/link';
import { Kanban, Globe } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NewEnquiryDialog } from '@/features/quote-requests/components/inbox/new-enquiry-dialog';
import { KpiMetricCards } from './kpi-metric-cards';
import { MonthlyIntakeChart } from './monthly-intake-chart';
import { ChannelBreakdown } from './channel-breakdown';
import { RecentActivityFeed } from './recent-activity-feed';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { DashboardOverviewData } from '../types';

interface DashboardOverviewViewProps {
  adminName?: string;
  data: DashboardOverviewData;
}

export function DashboardOverviewView({ adminName, data }: DashboardOverviewViewProps) {
  return (
    <div className='flex flex-col gap-6 pb-8'>
      {/* Top Welcome Banner & Quick Actions */}
      <div className='flex flex-col gap-4 rounded-xl border border-border/80 bg-linear-to-r from-card to-muted/20 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>
              Welcome back{adminName ? `, ${adminName}` : ''}
            </h1>
            <span className='rounded-full bg-red-600/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-600/20'>
              Live Ops
            </span>
          </div>
          <p className='text-xs text-muted-foreground'>
            Overview of your collision center’s live customer pipeline, active workshop jobs, and revenue metrics.
          </p>
        </div>

        {/* Quick Actions */}
        <div className='flex flex-wrap items-center gap-2'>
          <NewEnquiryDialog />

          <Link
            href={APP_ROUTES.leads.quotes.index}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 gap-1.5 text-xs font-medium')}
          >
            <Kanban className='size-3.5 text-red-600' />
            <span>Pipeline Board</span>
          </Link>

          <Link
            href={APP_ROUTES.content.homePage.index}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 gap-1.5 text-xs font-medium text-muted-foreground',
            )}
          >
            <Globe className='size-3.5' />
            <span className='hidden sm:inline'>Website Pages</span>
          </Link>
        </div>
      </div>

      {/* 6 Core KPIs */}
      <KpiMetricCards kpis={data.kpis} />

      {/* Analytics Charts (Monthly Trends & Channels) */}
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <MonthlyIntakeChart trends={data.monthlyTrends} />
        </div>
        <div>
          <ChannelBreakdown channels={data.channels} />
        </div>
      </div>

      {/* Recent Pipeline Activity */}
      <RecentActivityFeed leads={data.recentLeads} />
    </div>
  );
}
