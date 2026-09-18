'use client';

import { TrendingUp, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { DashboardMetrics, CustomerRecord } from '../types';

interface ReportsViewProps {
  metrics: DashboardMetrics;
  customers: CustomerRecord[];
}

export function ReportsView({ metrics, customers }: ReportsViewProps) {
  const websiteCount = customers.filter((c) => c.channel === 'Website Form').length;
  const phoneCount = customers.filter((c) => c.channel === 'Direct Phone Call').length;
  const whatsappCount = customers.filter((c) => c.channel === 'WhatsApp').length;
  const walkinCount = customers.filter((c) => c.channel === 'Walk-ins').length;
  const socialCount = customers.filter((c) => c.channel === 'Facebook / Social').length;
  const emailCount = customers.filter((c) => c.channel === 'Email').length;

  return (
    <div className='space-y-7'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='border-red-500/30 bg-red-500/10 font-mono text-[11px] tracking-wider text-red-400 uppercase'
            >
              PDF Module 6 • Reports &amp; Management Overview
            </Badge>
          </div>
          <h1 className='mt-1 text-2xl font-bold tracking-tight text-white'>
            Operational KPIs &amp; Executive Telemetry
          </h1>
          <p className='text-xs text-slate-400'>
            Key metrics and high-level KPIs at a glance: Enquiries, active pipeline, quotes, completed work, intake
            trends, and revenue.
          </p>
        </div>

        <Button
          type='button'
          variant='outline'
          size='sm'
          className='flex items-center gap-2 border-[#242a3e] bg-[#141824] px-4 text-xs font-medium text-slate-200 hover:bg-[#1a1f2e] hover:text-white'
        >
          <FileSpreadsheet className='size-4 text-emerald-400' />
          <span>Export Dublin Audit (CSV)</span>
        </Button>
      </div>

      {/* 6 Key Metrics Strip (from PDF Module 6) with shadcn Card */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        {/* KPI 1: Total New Enquiries */}
        <Card className='border-[#242a3e] bg-[#0f1219] text-slate-200 shadow-sm'>
          <CardContent className='p-4'>
            <span className='font-mono text-[10px] text-slate-400 uppercase'>1. Total New Enquiries</span>
            <div className='mt-2 font-sans text-2xl font-extrabold text-white'>{metrics.totalNewEnquiries}</div>
            <div className='mt-1 flex items-center gap-1 font-mono text-[11px] text-emerald-400'>
              <TrendingUp className='size-3' />
              <span>+12% this week</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Active Jobs */}
        <Card className='border-[#242a3e] bg-[#0f1219] text-slate-200 shadow-sm'>
          <CardContent className='p-4'>
            <span className='font-mono text-[10px] text-slate-400 uppercase'>2. Active Jobs</span>
            <div className='mt-2 font-sans text-2xl font-extrabold text-sky-400'>{metrics.activeJobs}</div>
            <div className='mt-1 font-mono text-[11px] text-slate-400'>85% floor capacity</div>
          </CardContent>
        </Card>

        {/* KPI 3: Completed Work */}
        <Card className='border-[#242a3e] bg-[#0f1219] text-slate-200 shadow-sm'>
          <CardContent className='p-4'>
            <span className='font-mono text-[10px] text-slate-400 uppercase'>3. Completed Work</span>
            <div className='mt-2 font-sans text-2xl font-extrabold text-emerald-400'>{metrics.completedWork}</div>
            <div className='mt-1 font-mono text-[11px] text-slate-400'>100% QC sign-off</div>
          </CardContent>
        </Card>

        {/* KPI 4: Pending Quotes */}
        <Card className='border-[#242a3e] bg-[#0f1219] text-slate-200 shadow-sm'>
          <CardContent className='p-4'>
            <span className='font-mono text-[10px] text-slate-400 uppercase'>4. Pending Quotes</span>
            <div className='mt-2 font-sans text-2xl font-extrabold text-amber-400'>
              €{metrics.pendingQuotesValue.toLocaleString()}
            </div>
            <div className='mt-1 font-mono text-[11px] text-slate-400'>{metrics.pendingQuotesCount} quotes active</div>
          </CardContent>
        </Card>

        {/* KPI 5: Monthly Intake Trends */}
        <Card className='border-[#242a3e] bg-[#0f1219] text-slate-200 shadow-sm'>
          <CardContent className='p-4'>
            <span className='font-mono text-[10px] text-slate-400 uppercase'>5. Monthly Intake</span>
            <div className='mt-2 font-sans text-2xl font-extrabold text-white'>62 Inquiries</div>
            <div className='mt-1 font-mono text-[11px] text-sky-400'>72% conversion rate</div>
          </CardContent>
        </Card>

        {/* KPI 6: Sales & Revenue */}
        <Card className='border-[#242a3e] bg-[#0f1219] text-slate-200 shadow-sm'>
          <CardContent className='p-4'>
            <span className='font-mono text-[10px] text-slate-400 uppercase'>6. Sales &amp; Revenue</span>
            <div className='mt-2 font-sans text-2xl font-extrabold text-emerald-400'>
              €{metrics.monthlyRevenue.toLocaleString()}
            </div>
            <div className='mt-1 flex items-center gap-1 font-mono text-[11px] text-emerald-400'>
              <TrendingUp className='size-3' />
              <span>+{metrics.revenueGrowthPercent}% MTD</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualizations with Card */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        {/* Left: 30-Day Intake Trends Chart */}
        <Card className='border-[#242a3e] bg-[#0f1219] p-5 text-slate-200 shadow-sm lg:col-span-8'>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h3 className='text-base font-bold text-white'>Monthly Intake Trends &amp; Revenue Run-rate</h3>
              <p className='text-xs text-slate-400'>
                Tracking daily job inflows against workshop completion throughput.
              </p>
            </div>
            <Badge variant='outline' className='border-[#242a3e] bg-[#141824] font-mono text-xs text-slate-400'>
              August – September 2026
            </Badge>
          </div>

          <div className='relative my-4 h-56 w-full'>
            <svg className='h-full w-full overflow-visible' preserveAspectRatio='none' viewBox='0 0 500 160'>
              <defs>
                <linearGradient id='repSkyGrad' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='0%' stopColor='#38bdf8' stopOpacity='0.3' />
                  <stop offset='100%' stopColor='#38bdf8' stopOpacity='0.0' />
                </linearGradient>
                <linearGradient id='repRedGrad' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='0%' stopColor='#dc2626' stopOpacity='0.3' />
                  <stop offset='100%' stopColor='#dc2626' stopOpacity='0.0' />
                </linearGradient>
              </defs>

              <line stroke='#1f2537' strokeDasharray='3,3' strokeWidth='1' x1='0' x2='500' y1='30' y2='30' />
              <line stroke='#1f2537' strokeDasharray='3,3' strokeWidth='1' x1='0' x2='500' y1='70' y2='70' />
              <line stroke='#1f2537' strokeDasharray='3,3' strokeWidth='1' x1='0' x2='500' y1='110' y2='110' />
              <line stroke='#242a3e' strokeWidth='1' x1='0' x2='500' y1='145' y2='145' />

              {/* Sky Blue Line & Area (Intake Volume) */}
              <polygon
                fill='url(#repSkyGrad)'
                points='0,145 0,110 50,95 100,105 150,75 200,60 250,75 300,50 350,40 400,30 450,25 500,18 500,145'
              />
              <polyline
                fill='none'
                points='0,110 50,95 100,105 150,75 200,60 250,75 300,50 350,40 400,30 450,25 500,18'
                stroke='#38bdf8'
                strokeWidth='2'
              />

              {/* Red Line & Area (Delivered Jobs) */}
              <polygon
                fill='url(#repRedGrad)'
                points='0,145 0,135 50,128 100,122 150,110 200,90 250,95 300,75 350,65 400,55 450,42 500,35 500,145'
              />
              <polyline
                fill='none'
                points='0,135 50,128 100,122 150,110 200,90 250,95 300,75 350,65 400,55 450,42 500,35'
                stroke='#dc2626'
                strokeWidth='2'
              />
            </svg>
          </div>

          <div className='flex items-center justify-between border-t border-[#1a1f2e] pt-2 font-mono text-[10px] text-slate-500'>
            <span>WEEK 32</span>
            <span>WEEK 33</span>
            <span>WEEK 34</span>
            <span>WEEK 35</span>
            <span className='font-bold text-sky-400'>CURRENT WEEK</span>
          </div>
        </Card>

        {/* Right: Intake Channel Distribution (PDF Module 1) */}
        <Card className='flex flex-col justify-between border-[#242a3e] bg-[#0f1219] p-5 text-slate-200 shadow-sm lg:col-span-4'>
          <div>
            <h3 className='text-base font-bold text-white'>Intake Channel Distribution</h3>
            <p className='text-xs text-slate-400'>Breakdown of how customer inquiries reach the Dublin workshop.</p>
          </div>

          <div className='my-4 space-y-3 font-mono text-xs'>
            <div>
              <div className='mb-1 flex justify-between text-slate-300'>
                <span>Website Online Form</span>
                <span className='text-white'>{websiteCount}</span>
              </div>
              <Progress value={35} className='h-2 bg-[#1a1f2e]' />
            </div>

            <div>
              <div className='mb-1 flex justify-between text-slate-300'>
                <span>Direct Phone Call</span>
                <span className='text-white'>{phoneCount}</span>
              </div>
              <Progress value={25} className='h-2 bg-[#1a1f2e]' />
            </div>

            <div>
              <div className='mb-1 flex justify-between text-slate-300'>
                <span>WhatsApp Hotline</span>
                <span className='text-white'>{whatsappCount}</span>
              </div>
              <Progress value={20} className='h-2 bg-[#1a1f2e]' />
            </div>

            <div>
              <div className='mb-1 flex justify-between text-slate-300'>
                <span>Walk-ins</span>
                <span className='text-white'>{walkinCount}</span>
              </div>
              <Progress value={10} className='h-2 bg-[#1a1f2e]' />
            </div>

            <div>
              <div className='mb-1 flex justify-between text-slate-300'>
                <span>Facebook / Social</span>
                <span className='text-white'>{socialCount}</span>
              </div>
              <Progress value={5} className='h-2 bg-[#1a1f2e]' />
            </div>

            <div>
              <div className='mb-1 flex justify-between text-slate-300'>
                <span>Direct Email</span>
                <span className='text-white'>{emailCount}</span>
              </div>
              <Progress value={5} className='h-2 bg-[#1a1f2e]' />
            </div>
          </div>

          <div className='border-t border-[#1a1f2e] pt-2 text-center font-mono text-[10px] text-slate-500'>
            Top channel: Website Form (35% of all intake)
          </div>
        </Card>
      </div>
    </div>
  );
}
