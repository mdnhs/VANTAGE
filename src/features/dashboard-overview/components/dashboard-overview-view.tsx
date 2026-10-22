'use client';

import Link from 'next/link';
import { Kanban, Globe } from 'lucide-react';
import { useCan } from '@/contexts/actor-provider';
import { LINK_SECONDARY, PageHeader } from '@/components/admin/dashboard/page-header';
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
  const canReadQuotes = useCan({ quote: ['read'] });
  return (
    <div className='flex flex-col gap-6 pb-8'>
      <PageHeader
        title={`Welcome back${adminName ? `, ${adminName}` : ''}`}
        description='Overview of your collision center’s live customer pipeline, active workshop jobs, and revenue metrics.'
        actions={
          <>
            {canReadQuotes ? (
              <>
                <NewEnquiryDialog />
                <Link href={APP_ROUTES.leads.quotes.index} className={LINK_SECONDARY}>
                  <Kanban className='size-4' />
                  <span>Pipeline Board</span>
                </Link>
              </>
            ) : null}
            <Link href={APP_ROUTES.content.homePage.index} className={LINK_SECONDARY}>
              <Globe className='size-4' />
              <span className='hidden sm:inline'>Website Pages</span>
            </Link>
          </>
        }
      />

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
