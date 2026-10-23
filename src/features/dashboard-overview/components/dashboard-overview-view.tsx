'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { ArrowRight, CircleCheck, Circle, ExternalLink, Globe, Kanban, LayoutDashboard } from 'lucide-react';
import { useActor, useCan } from '@/contexts/actor-provider';
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed';
import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { formatNumber } from '@/components/admin/dashboard/format';
import { Gauge } from '@/components/admin/dashboard/gauge';
import { KpiCard } from '@/components/admin/dashboard/kpi-card';
import { LINK_PRIMARY, LINK_SECONDARY, PageHeader, PRIMARY_ACTION } from '@/components/admin/dashboard/page-header';
import { PillBarChart } from '@/components/admin/dashboard/pill-bar-chart';
import { kpiGridClass } from '@/components/admin/dashboard/skeletons';
import { Button } from '@/components/ui/button';
import { hasPermission, type Permissions } from '@/lib/auth/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { cn } from '@/lib/utils';
import { NewEnquiryDialog } from '@/features/quote-requests/components/inbox/new-enquiry-dialog';
import { HomePageTabs, type HomePageTabsProps } from '@/features/home-page/components/home-page-tabs';
import { KpiMetricCards } from './kpi-metric-cards';
import { MonthlyIntakeChart } from './monthly-intake-chart';
import { ChannelBreakdown } from './channel-breakdown';
import { RecentActivityFeed } from './recent-activity-feed';
import { actionStatus, dashboardGreeting, kpisFor, setupSteps } from '../utils/present';
import type { DashboardDto } from '../types';

interface DashboardOverviewViewProps {
  adminName: string;
  renderedAt: string;
  siteUrl: string;
  // null when the dashboard failed to load.
  dashboard: DashboardDto | null;
  websiteData?: HomePageTabsProps | null;
}

export function DashboardOverviewView({
  adminName,
  renderedAt,
  siteUrl,
  dashboard,
  websiteData,
}: DashboardOverviewViewProps) {
  const canReadQuotes = useCan({ quote: ['read'] });
  const canReadWebsite = useCan({ page: ['read'] });
  const router = useRouter();
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(['overview', 'website'] as const).withDefault('overview'),
  );
  const greeting = dashboardGreeting(adminName, dashboard?.generatedAt, renderedAt);

  return (
    <div className='flex flex-col gap-6 pb-8'>
      <PageHeader
        title={greeting}
        titleTestId='greeting'
        description="Here's what's happening across your admin."
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            {canReadQuotes ? (
              <>
                <NewEnquiryDialog />
                <Link href={APP_ROUTES.leads.quotes.index} className={LINK_SECONDARY}>
                  <Kanban className='size-4' />
                  <span>Pipeline Board</span>
                </Link>
              </>
            ) : null}
            <a href={siteUrl} target='_blank' rel='noreferrer' data-slot='button' className={LINK_SECONDARY}>
              View site
              <span className='sr-only'> (opens in a new tab)</span>
            </a>
          </div>
        }
      />

      {/* Unified Tab Switcher for Merged Dashboard */}
      {canReadWebsite && websiteData ? (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-1.5 shadow-xs backdrop-blur-md'>
          <div className='flex items-center gap-1.5'>
            <button
              type='button'
              onClick={() => setView('overview')}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                view === 'overview'
                  ? 'bg-primary font-semibold text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
              )}
            >
              <LayoutDashboard className='size-4' />
              <span>Operations & Overview</span>
            </button>
            <button
              type='button'
              onClick={() => setView('website')}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                view === 'website'
                  ? 'bg-primary font-semibold text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
              )}
            >
              <Globe className='size-4' />
              <span>Website Editor</span>
              <span className='ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary group-hover:text-foreground'>
                Live
              </span>
            </button>
          </div>

          <div className='hidden items-center gap-2 pr-2 text-xs text-muted-foreground md:flex'>
            <span className='size-2 animate-pulse rounded-full bg-emerald-500' />
            <span>Unified Admin Hub</span>
          </div>
        </div>
      ) : null}

      {view === 'website' && websiteData ? (
        <WebsiteEditorPanel websiteData={websiteData} siteUrl={siteUrl} />
      ) : dashboard ? (
        <DashboardBody data={dashboard} onOpenWebsite={websiteData ? () => setView('website') : undefined} />
      ) : (
        <EmptyState
          title="The dashboard didn't load"
          description='Check your connection, then try again.'
          action={
            <Button className={PRIMARY_ACTION} onClick={() => router.refresh()}>
              Try again
            </Button>
          }
        />
      )}
    </div>
  );
}

function WebsiteEditorPanel({ websiteData, siteUrl }: { websiteData: HomePageTabsProps; siteUrl: string }) {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-semibold tracking-tight text-foreground'>Website Editor & Content Hub</h2>
            <span className='inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500'>
              <span className='size-1.5 animate-pulse rounded-full bg-emerald-500' />
              Live CMS
            </span>
          </div>
          <p className='text-xs text-muted-foreground sm:text-sm'>
            Updates to page copy, pillars, testimonials, and catalog items save live to the production website.
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <a
            href={siteUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 rounded-xl border border-border bg-sidebar-accent px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-sidebar-accent/80'
          >
            <span>Live site preview</span>
            <ExternalLink className='size-3.5' />
          </a>
        </div>
      </div>

      {/* Direct links to other website pages */}
      <div className='flex flex-wrap items-center gap-2 border-b border-border/70 pb-3'>
        <span className='mr-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
          Website Pages:
        </span>
        <span className='rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs'>
          Home page
        </span>
        <Link
          href='/dashboard/services'
          className='rounded-lg bg-sidebar-accent/80 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'
        >
          Services
        </Link>
        <Link
          href='/dashboard/projects'
          className='rounded-lg bg-sidebar-accent/80 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'
        >
          Our work
        </Link>
        <Link
          href='/dashboard/insurance'
          className='rounded-lg bg-sidebar-accent/80 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'
        >
          Insurance
        </Link>
        <Link
          href='/dashboard/about'
          className='rounded-lg bg-sidebar-accent/80 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'
        >
          About
        </Link>
        <Link
          href='/dashboard/process-page'
          className='rounded-lg bg-sidebar-accent/80 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'
        >
          Process
        </Link>
      </div>

      <HomePageTabs
        pillars={websiteData.pillars}
        catalogItems={websiteData.catalogItems}
        processSteps={websiteData.processSteps}
        testimonials={websiteData.testimonials}
        partnerLogos={websiteData.partnerLogos}
      />
    </div>
  );
}

function DashboardBody({ data, onOpenWebsite }: { data: DashboardDto; onOpenWebsite?: () => void }) {
  const actor = useActor();
  const can = (p: Permissions) => hasPermission(actor.roles, p);
  // Relative times are measured from the server's clock, so they read the
  // same however long the tab has been open.
  const now = Date.parse(data.generatedAt);
  const kpis = kpisFor(data, can);
  const next = data.nextUp.find((item) => !item.done);
  const steps = setupSteps(data.nextUp);
  const week = data.enquiriesWeek;
  const quiet = week ? week.current === 0 && week.previous === 0 : false;
  const health = data.contentHealth;

  return (
    <>
      {/* Quick Website CMS banner on Overview */}
      {onOpenWebsite ? (
        <div className='relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-primary/5 p-5 shadow-xs'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-start gap-3.5'>
              <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary'>
                <Globe className='size-5' />
              </div>
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-sm font-semibold text-foreground sm:text-base'>Website Content & Live CMS</h3>
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500'>
                    <span className='size-1.5 animate-pulse rounded-full bg-emerald-500' />
                    Live
                  </span>
                </div>
                <p className='text-xs text-muted-foreground sm:text-sm'>
                  Edit homepage hero text, feature pillars, catalog, testimonials, and SEO right from this dashboard.
                </p>
                <div className='mt-1.5 flex flex-wrap gap-1.5 text-xs'>
                  <Link
                    href='/dashboard/services'
                    className='rounded-md bg-sidebar-accent px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground'
                  >
                    Services
                  </Link>
                  <Link
                    href='/dashboard/projects'
                    className='rounded-md bg-sidebar-accent px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground'
                  >
                    Our work
                  </Link>
                  <Link
                    href='/dashboard/insurance'
                    className='rounded-md bg-sidebar-accent px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground'
                  >
                    Insurance
                  </Link>
                  <Link
                    href='/dashboard/about'
                    className='rounded-md bg-sidebar-accent px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground'
                  >
                    About
                  </Link>
                  <Link
                    href='/dashboard/process-page'
                    className='rounded-md bg-sidebar-accent px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground'
                  >
                    Process
                  </Link>
                </div>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <button
                type='button'
                onClick={onOpenWebsite}
                className='inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 sm:text-sm'
              >
                <span>Edit Website</span>
                <ArrowRight className='size-4' />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {kpis.length > 0 ? (
        <>
          {/* The KPI cards title themselves with h3s; this keeps the outline
              from jumping from the page's h1 straight to them. */}
          <h2 className='sr-only'>Key figures</h2>
          <div className={kpiGridClass(kpis.length)}>
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>
        </>
      ) : null}
      <div className={cn('grid gap-4', week && 'xl:grid-cols-[minmax(0,1fr)_340px]')}>
        {week ? (
          <DashboardCard title='Enquiries this week'>
            <div className='relative'>
              <PillBarChart
                title='Enquiries this week'
                data={week.days}
                currentLabel='This week'
                previousLabel='Last week'
              />
              {quiet ? (
                // Over the empty plot, so a quiet fortnight reads as such
                // rather than as a chart that failed to draw.
                <div className='pointer-events-none absolute inset-x-0 top-0 flex h-64 flex-col items-center justify-center gap-1 text-center'>
                  <p className='text-base font-semibold'>No enquiries yet</p>
                  <p className='max-w-xs text-sm text-muted-foreground'>
                    Each day&apos;s enquiries this week and last will show here.
                  </p>
                </div>
              ) : null}
            </div>
          </DashboardCard>
        ) : null}
        <DashboardCard title='Next up'>
          <div className='flex flex-1 flex-col justify-between gap-6'>
            <div className='flex flex-col gap-3'>
              <p className='text-2xl leading-tight font-semibold text-primary'>
                {next ? next.title : "You're all set"}
              </p>
              <p className='text-sm text-muted-foreground'>
                {next
                  ? next.description
                  : 'Every setup step is done. New suggestions will appear here as the site grows.'}
              </p>
            </div>
            {/* One step is already the headline; a list of one repeats it. */}
            {steps.length > 1 ? (
              <ul aria-label='Setup checklist' className='flex flex-col gap-2'>
                {steps.map((item) => (
                  <li key={item.id} className='flex items-center gap-2 text-sm'>
                    {item.done ? (
                      <CircleCheck aria-hidden className='size-4 text-success' />
                    ) : (
                      <Circle aria-hidden className='size-4 text-muted-foreground' />
                    )}
                    <span className={cn(item.done && 'text-muted-foreground')}>{item.title}</span>
                    <span className='sr-only'>{item.done ? '(done)' : '(to do)'}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {next ? (
              <Link href={next.href} data-slot='button' className={LINK_PRIMARY}>
                {next.cta}
              </Link>
            ) : null}
          </div>
        </DashboardCard>
      </div>
      {data.recentActivity || health ? (
        <div className={cn('grid gap-4', data.recentActivity && health && 'xl:grid-cols-[minmax(0,1fr)_380px]')}>
          {data.recentActivity ? (
            <DashboardCard title='Team activity'>
              <ActivityFeed
                now={now}
                emptyTitle='No activity yet'
                emptyDescription='Publishing, enquiries and sign-ins by your team will show here.'
                entries={data.recentActivity.map((row) => ({
                  id: row.id,
                  name: row.actorName ?? row.actorEmail ?? 'System',
                  description: row.summary,
                  at: row.createdAt,
                  status: actionStatus(row.action),
                }))}
              />
            </DashboardCard>
          ) : null}
          {health ? (
            <DashboardCard title='Content health'>
              <Gauge
                title='Content health'
                centerLabel='Complete'
                headlineKey='complete'
                parts={[
                  { key: 'complete', label: 'Complete', value: health.complete, tone: 'solid' },
                  { key: 'work', label: 'Needs work', value: health.needsWork, tone: 'dark' },
                  { key: 'missing', label: 'Missing SEO or alt', value: health.missing, tone: 'hatched' },
                ]}
              />
              {health.findings?.length ? (
                <div className='flex flex-col gap-2'>
                  <h3 className='text-sm font-semibold'>Content to review ({formatNumber(health.findingsTotal)})</h3>
                  <ul aria-label='Content findings' className='flex flex-col gap-2 text-sm'>
                    {health.findings.map((finding, index) => (
                      // Two findings can share a label and href.
                      <li key={`${index}:${finding.href}:${finding.label}`}>
                        <Link href={finding.href} className='font-medium underline-offset-4 hover:underline'>
                          {finding.label}
                        </Link>
                        <span className='block text-muted-foreground'>{finding.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </DashboardCard>
          ) : null}
        </div>
      ) : null}

      {/* VANTAGE pipeline: only for roles that may read quotes. */}
      {data.pipeline ? <PipelineBlock data={data.pipeline} /> : null}
    </>
  );
}

function PipelineBlock({ data }: { data: NonNullable<DashboardDto['pipeline']> }) {
  return (
    <>
      <KpiMetricCards kpis={data.kpis} />
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <MonthlyIntakeChart trends={data.monthlyTrends} />
        </div>
        <div>
          <ChannelBreakdown channels={data.channels} />
        </div>
      </div>
      <RecentActivityFeed leads={data.recentLeads} />
    </>
  );
}
