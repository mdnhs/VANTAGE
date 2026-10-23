'use client';

import { KpiCard } from '@/components/admin/dashboard/kpi-card';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { DashboardKPIs } from '../types';

interface KpiMetricCardsProps {
  kpis: DashboardKPIs;
}

export function KpiMetricCards({ kpis }: KpiMetricCardsProps) {
  const quotes = APP_ROUTES.leads.quotes.index;
  const euro = (n: number, min = 0) =>
    `€${n.toLocaleString('en-IE', { minimumFractionDigits: min, maximumFractionDigits: 0 })}`;

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      <KpiCard
        variant='hero'
        label='Total New Enquiries'
        value={String(kpis.totalNewEnquiries)}
        caption={
          kpis.totalNewEnquiries > 0
            ? `${kpis.totalNewEnquiries} action needed · incoming leads awaiting initial contact`
            : 'All caught up · no leads awaiting initial contact'
        }
        href={`${quotes}?status=new`}
      />
      <KpiCard
        label='Active Jobs'
        value={String(kpis.activeJobs)}
        caption='Vehicles currently in workshop or approved'
        href={`${quotes}?status=in_progress`}
      />
      <KpiCard
        label='Completed Work'
        value={String(kpis.completedWork)}
        caption='Repairs finished and delivered to clients'
        href={`${quotes}?status=completed`}
      />
      <KpiCard
        label='Pending Quotes'
        value={String(kpis.pendingQuotes)}
        caption='Estimates sent awaiting customer sign-off'
        href={`${quotes}?status=quote_sent`}
      />
      <KpiCard
        label='Sales & Revenue'
        value={euro(kpis.salesRevenue)}
        caption={`Total open pipeline: ${euro(kpis.pipelineValue)}`}
        href={quotes}
      />
      <KpiCard
        label='Conversion Rate'
        value={`${kpis.conversionRate}%`}
        caption={`Out of ${kpis.totalInquiries} total customer leads`}
        href={quotes}
      />
    </div>
  );
}
