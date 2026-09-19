'use client';

import { Sparkles, Wrench, CheckCircle2, FileText, Euro, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardKPIs } from '../types';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes/app-routes';

interface KpiMetricCardsProps {
  kpis: DashboardKPIs;
}

export function KpiMetricCards({ kpis }: KpiMetricCardsProps) {
  const cards = [
    {
      title: 'Total New Enquiries',
      value: kpis.totalNewEnquiries,
      subtext: 'Incoming leads awaiting initial contact',
      badge: kpis.totalNewEnquiries > 0 ? `${kpis.totalNewEnquiries} Action Needed` : 'All Caught Up',
      badgeType: kpis.totalNewEnquiries > 0 ? 'rose' : 'muted',
      icon: Sparkles,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-l-rose-500',
      href: `${APP_ROUTES.leads.quotes.index}?status=new`,
    },
    {
      title: 'Active Jobs',
      value: kpis.activeJobs,
      subtext: 'Vehicles currently in workshop or approved',
      badge: 'In Workshop',
      badgeType: 'indigo',
      icon: Wrench,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-l-indigo-500',
      href: `${APP_ROUTES.leads.quotes.index}?status=in_progress`,
    },
    {
      title: 'Completed Work',
      value: kpis.completedWork,
      subtext: 'Repairs finished and delivered to clients',
      badge: 'Delivered',
      badgeType: 'emerald',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-l-emerald-500',
      href: `${APP_ROUTES.leads.quotes.index}?status=completed`,
    },
    {
      title: 'Pending Quotes',
      value: kpis.pendingQuotes,
      subtext: 'Estimates sent awaiting customer sign-off',
      badge: 'Awaiting Decision',
      badgeType: 'purple',
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-l-purple-500',
      href: `${APP_ROUTES.leads.quotes.index}?status=quote_sent`,
    },
    {
      title: 'Sales & Revenue',
      value: `€${kpis.salesRevenue.toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtext: `Total open pipeline: €${kpis.pipelineValue.toLocaleString('en-IE', { minimumFractionDigits: 0 })}`,
      badge: 'Confirmed Revenue',
      badgeType: 'amber',
      icon: Euro,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-l-amber-500',
      href: APP_ROUTES.leads.quotes.index,
    },
    {
      title: 'Conversion Rate',
      value: `${kpis.conversionRate}%`,
      subtext: `Out of ${kpis.totalInquiries} total customer leads`,
      badge: 'Inquiry ➔ Job',
      badgeType: 'teal',
      icon: TrendingUp,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-l-teal-500',
      href: APP_ROUTES.leads.quotes.index,
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3'>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.title} href={card.href} className='group block'>
            <Card
              className={cn(
                'relative overflow-hidden border-l-4 transition-all duration-150 hover:border-border hover:shadow-md active:scale-[0.99]',
                card.borderColor,
              )}
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                      {card.title}
                    </span>
                    <div className='flex items-baseline gap-2'>
                      <span className='text-2xl font-black tracking-tight text-foreground sm:text-3xl'>
                        {card.value}
                      </span>
                    </div>
                  </div>

                  <div className={cn('flex size-9 items-center justify-center rounded-lg', card.bgColor, card.color)}>
                    <Icon className='size-4.5' />
                  </div>
                </div>

                <div className='mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground'>
                  <span className='truncate text-[11px]'>{card.subtext}</span>
                  <div className='flex items-center gap-1 font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100'>
                    <span className='text-[10px]'>View</span>
                    <ArrowUpRight className='size-3' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
