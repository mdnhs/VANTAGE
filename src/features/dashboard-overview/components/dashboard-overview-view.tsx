'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleCheck, Circle, Globe, Kanban } from 'lucide-react';
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
}

export function DashboardOverviewView({ adminName, renderedAt, siteUrl, dashboard }: DashboardOverviewViewProps) {
  const canReadQuotes = useCan({ quote: ['read'] });
  const router = useRouter();
  const greeting = dashboardGreeting(adminName, dashboard?.generatedAt, renderedAt);

  return (
    <div className='flex flex-col gap-6 pb-8'>
      <PageHeader
        title={greeting}
        titleTestId='greeting'
        description="Here's what's happening across your admin."
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
            <a href={siteUrl} target='_blank' rel='noreferrer' data-slot='button' className={LINK_SECONDARY}>
              View site
              <span className='sr-only'> (opens in a new tab)</span>
            </a>
          </>
        }
      />
      {dashboard ? (
        <DashboardBody data={dashboard} />
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

function DashboardBody({ data }: { data: DashboardDto }) {
  const actor = useActor();
  const can = (p: Permissions) => hasPermission(actor.roles, p);
  const now = Date.parse(data.generatedAt);
  const next = data.nextUp.find((item) => !item.done);
  const steps = setupSteps(data.nextUp);
  const week = data.enquiriesWeek;
  const quiet = week ? week.current === 0 && week.previous === 0 : false;
  const health = data.contentHealth;
  const pipeline = data.pipeline;

  // When pipeline data is present (workshop & quotes access), merge both dashboards into one cohesive view
  if (pipeline) {
    const quotes = APP_ROUTES.leads.quotes.index;
    const euro = (n: number, min = 0) =>
      `€${n.toLocaleString('en-IE', { minimumFractionDigits: min, maximumFractionDigits: 0 })}`;

    return (
      <div className='flex flex-col gap-6'>
        {/* Tier 1: Merged Unified KPI Metrics */}
        <div>
          <h2 className='sr-only'>Key figures</h2>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            <KpiCard
              variant='hero'
              label='Total New Enquiries'
              value={String(pipeline.kpis.totalNewEnquiries)}
              caption={
                pipeline.kpis.totalNewEnquiries > 0
                  ? `${pipeline.kpis.totalNewEnquiries} action needed · incoming leads awaiting initial contact`
                  : 'All caught up · no leads awaiting contact'
              }
              href={`${quotes}?status=new`}
            />
            <KpiCard
              label='Active Jobs'
              value={String(pipeline.kpis.activeJobs)}
              caption='Vehicles currently in workshop or approved'
              href={`${quotes}?status=in_progress`}
            />
            <KpiCard
              label='Completed Work'
              value={String(pipeline.kpis.completedWork)}
              caption='Repairs finished and delivered to clients'
              href={`${quotes}?status=completed`}
            />
            <KpiCard
              label='Pending Quotes'
              value={String(pipeline.kpis.pendingQuotes)}
              caption='Estimates sent awaiting customer sign-off'
              href={`${quotes}?status=quote_sent`}
            />
            <KpiCard
              label='Sales & Revenue'
              value={euro(pipeline.kpis.salesRevenue)}
              caption={`Total open pipeline: ${euro(pipeline.kpis.pipelineValue)}`}
              href={quotes}
            />
            <KpiCard
              label='Conversion Rate'
              value={`${pipeline.kpis.conversionRate}%`}
              caption={`Out of ${pipeline.kpis.totalInquiries} total customer leads`}
              href={quotes}
            />
            {data.seoHealth ? (
              <KpiCard
                label='SEO Health'
                value={`${data.seoHealth.score}%`}
                caption={data.seoHealth.issues ? `${data.seoHealth.issues} issues to fix` : 'All SEO checks passing'}
                href={can({ seo: ['read'] }) ? '/dashboard/seo' : undefined}
              />
            ) : null}
            {data.enquiries ? (
              <KpiCard
                label='30-Day Intake'
                value={formatNumber(data.enquiries.value)}
                caption={
                  data.enquiries.previous > 0
                    ? `${formatNumber(data.enquiries.previous)} in prior 30 days`
                    : 'Total enquiries in last 30 days'
                }
                href={quotes}
              />
            ) : null}
          </div>
        </div>

        {/* Tier 2: Trends & Lead Channels */}
        <div className='grid grid-cols-1 gap-5 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <MonthlyIntakeChart trends={pipeline.monthlyTrends} />
          </div>
          <div>
            <ChannelBreakdown channels={pipeline.channels} />
          </div>
        </div>

        {/* Tier 3: Operations, Recent Leads & Next Steps */}
        <div className='grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]'>
          <div>
            <RecentActivityFeed leads={pipeline.recentLeads} />
          </div>
          <div className='flex flex-col gap-5'>
            {/* Action items / Next up checklist */}
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

            {/* Daily week chart */}
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
          </div>
        </div>

        {/* Tier 4: Team Activity & Content Health */}
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
      </div>
    );
  }

  // Fallback for roles without pipeline access
  const kpis = kpisFor(data, can);

  return (
    <>
      {kpis.length > 0 ? (
        <>
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
    </>
  );
}
