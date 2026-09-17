'use client';

import { useState } from 'react';
import { Car, RotateCw, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CustomerRecord, DashboardMetrics } from '../types';

interface OverviewViewProps {
  metrics: DashboardMetrics;
  customers: CustomerRecord[];
  onSelectCustomer: (customer: CustomerRecord) => void;
}

export function OverviewView({ metrics, customers, onSelectCustomer }: OverviewViewProps) {
  const [bayFilter, setBayFilter] = useState<'all' | 'active' | 'booth'>('all');

  const filteredJobs = customers.filter((job) => {
    if (bayFilter === 'active') return job.status === 'Work in Progress';
    if (bayFilter === 'booth') return job.bay?.includes('Booth');
    return true;
  });

  return (
    <div className='space-y-7'>
      {/* Executive Overview Title */}
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='size-2 animate-pulse rounded-full bg-emerald-400' />
            <span className='font-mono text-[11px] font-semibold tracking-wider text-slate-400 uppercase'>
              Dublin Facility Live Telemetry
            </span>
          </div>
          <h1 className='mt-1 text-2xl font-bold tracking-tight text-white'>Workshop Control &amp; Dispatch</h1>
          <p className='mt-0.5 text-xs text-slate-400'>
            Real-time throughput, spray booth cycles, and structural realignment telemetry.
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='flex items-center gap-2 border-[#242a3e] bg-[#141824] text-xs text-slate-200 hover:bg-[#1a1f2e] hover:text-white'
          >
            <FileText className='size-4 text-slate-400' />
            <span>Shift Handover Brief</span>
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='flex items-center gap-2 border-[#242a3e] bg-[#141824] text-xs text-slate-200 hover:bg-[#1a1f2e] hover:text-white'
          >
            <RotateCw className='size-4 text-slate-400' />
            <span>Audatex Sync</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip (Stitch 4-card strip with shadcn Card) */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Metric 1 */}
        <Card className='group relative overflow-hidden border-[#242a3e] bg-[#0f1219] text-slate-200 transition hover:border-slate-600'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between text-xs text-slate-400'>
              <span className='font-medium'>Active In-Repair</span>
              <Badge
                variant='outline'
                className='border-emerald-500/20 bg-emerald-500/10 font-mono text-[10px] text-emerald-400'
              >
                On Track
              </Badge>
            </div>
            <div className='mt-3 flex items-baseline gap-2'>
              <span className='font-sans text-3xl font-extrabold tracking-tight text-white'>{metrics.activeJobs}</span>
              <span className='font-mono text-xs text-slate-400'>/ 20 cap</span>
            </div>
            <div className='mt-3 flex items-center justify-between border-t border-[#1a1f2e] pt-2.5 text-[11px] text-slate-400'>
              <span>2 in Spray Booth</span>
              <span className='font-mono text-sky-400'>3 in Assembly</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className='group relative overflow-hidden border-[#242a3e] bg-[#0f1219] text-slate-200 transition hover:border-slate-600'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between text-xs text-slate-400'>
              <span className='font-medium'>Pending Estimates</span>
              <Badge
                variant='outline'
                className='border-amber-500/20 bg-amber-500/10 font-mono text-[10px] text-amber-400'
              >
                4 Expiring
              </Badge>
            </div>
            <div className='mt-3 flex items-baseline gap-2'>
              <span className='font-sans text-3xl font-extrabold tracking-tight text-white'>
                €{metrics.pendingQuotesValue.toLocaleString()}
              </span>
            </div>
            <div className='mt-3 flex items-center justify-between border-t border-[#1a1f2e] pt-2.5 text-[11px] text-slate-400'>
              <span>{metrics.pendingQuotesCount} Active Quotes</span>
              <span className='font-mono text-amber-400'>Avg SLA 18m</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className='group relative overflow-hidden border-[#242a3e] bg-[#0f1219] text-slate-200 transition hover:border-slate-600'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between text-xs text-slate-400'>
              <span className='font-medium'>Completed MTD</span>
              <Badge
                variant='outline'
                className='border-emerald-500/20 bg-emerald-500/10 font-mono text-[10px] text-emerald-400'
              >
                +14% vs Aug
              </Badge>
            </div>
            <div className='mt-3 flex items-baseline gap-2'>
              <span className='font-sans text-3xl font-extrabold tracking-tight text-white'>
                {metrics.completedWork}
              </span>
              <span className='font-mono text-xs text-slate-400'>Vehicles</span>
            </div>
            <div className='mt-3 flex items-center justify-between border-t border-[#1a1f2e] pt-2.5 text-[11px] text-slate-400'>
              <span>Avg Turnaround: 4.8d</span>
              <span className='font-mono text-emerald-400'>100% Pass QC</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className='group relative overflow-hidden border-[#242a3e] bg-[#0f1219] text-slate-200 transition hover:border-slate-600'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between text-xs text-slate-400'>
              <span className='font-medium'>Bay Utilization</span>
              <Badge variant='outline' className='border-sky-500/20 bg-sky-500/10 font-mono text-[10px] text-sky-400'>
                6/8 Active
              </Badge>
            </div>
            <div className='mt-3 flex items-baseline gap-2'>
              <span className='font-sans text-3xl font-extrabold tracking-tight text-white'>
                {metrics.bayUtilizationPercent}%
              </span>
              <span className='font-mono text-xs text-slate-400'>facility load</span>
            </div>
            <div className='mt-3 flex items-center justify-between border-t border-[#1a1f2e] pt-2.5 text-[11px] text-slate-400'>
              <span>2 Bays Available</span>
              <span className='font-mono text-slate-300'>Bake cycle: 68°C</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repair Pipeline Stage Tracker (7 Stages from Stitch) */}
      <Card className='border-[#242a3e] bg-[#0f1219] text-slate-200'>
        <CardContent className='p-5'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-bold tracking-wider text-slate-300 uppercase'>
                Live Repair Lifecycle Pipeline
              </span>
              <Badge variant='outline' className='border-transparent bg-[#141824] font-mono text-[11px] text-slate-400'>
                {customers.length} Jobs Across Dublin HQ
              </Badge>
            </div>
            <div className='font-mono text-[11px] text-slate-400'>
              Bottleneck Stage: <span className='font-semibold text-red-400'>Spray Booth (90% capacity)</span>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7'>
            {[
              { label: '1. Intake', count: 5, pct: 66, color: 'bg-slate-400' },
              { label: '2. Inspection', count: 3, pct: 50, color: 'bg-slate-400' },
              { label: '3. Estimating', count: 4, pct: 60, color: 'bg-slate-400' },
              { label: '4. Approved', count: 6, pct: 80, color: 'bg-emerald-500' },
              {
                label: '5. In Repair',
                count: 8,
                pct: 100,
                color: 'bg-red-500',
                highlight: true,
              },
              { label: '6. QC & NCT', count: 3, pct: 50, color: 'bg-sky-400' },
              { label: '7. Ready Handover', count: 2, pct: 33, color: 'bg-emerald-400' },
            ].map((st) => (
              <div
                key={st.label}
                className={`relative flex flex-col justify-between rounded-lg p-3 ${
                  st.highlight
                    ? 'border border-red-500/40 bg-red-950/20 shadow-sm'
                    : 'border border-[#242a3e] bg-[#0a0c10]'
                }`}
              >
                <div className='mb-2 flex items-center justify-between'>
                  <span
                    className={`text-[11px] font-semibold ${
                      st.highlight ? 'font-bold text-red-300' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                  <Badge
                    variant='outline'
                    className={`px-1.5 py-0 font-mono text-xs font-bold text-white ${
                      st.highlight ? 'border-red-500 bg-red-600' : 'border-[#242a3e] bg-[#1a1f2e]'
                    }`}
                  >
                    {st.count}
                  </Badge>
                </div>
                <div className='h-1 w-full overflow-hidden rounded-full bg-[#1a1f2e]'>
                  <div className={`h-full ${st.color}`} style={{ width: `${st.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workshop Bay & Live Dispatch Table Section */}
      <div className='overflow-hidden rounded-xl border border-[#242a3e] bg-[#0f1219]'>
        <div className='flex flex-col justify-between gap-3 border-b border-[#242a3e] p-5 sm:flex-row sm:items-center'>
          <div className='flex items-center gap-3'>
            <div className='flex size-8 items-center justify-center rounded-lg border border-[#242a3e] bg-[#1a1f2e] text-sky-400'>
              <Car className='size-4' />
            </div>
            <div>
              <h2 className='text-base font-bold tracking-tight text-white'>
                Today&apos;s Bay Allocation &amp; Dispatch Queue
              </h2>
              <p className='text-xs text-slate-400'>
                Active chassis tracking, technician assignments, and NCT compliance milestones.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex items-center rounded-lg border border-[#242a3e] bg-[#0a0c10] p-1 text-xs'>
              <Button
                type='button'
                variant={bayFilter === 'all' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setBayFilter('all')}
                className={`h-7 px-2.5 text-xs font-medium transition ${
                  bayFilter === 'all'
                    ? 'bg-[#1a1f2e] text-white hover:bg-[#22283a]'
                    : 'text-slate-400 hover:bg-[#141824] hover:text-white'
                }`}
              >
                All Bays ({customers.length})
              </Button>
              <Button
                type='button'
                variant={bayFilter === 'active' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setBayFilter('active')}
                className={`h-7 px-2.5 text-xs font-medium transition ${
                  bayFilter === 'active'
                    ? 'bg-[#1a1f2e] text-white hover:bg-[#22283a]'
                    : 'text-slate-400 hover:bg-[#141824] hover:text-white'
                }`}
              >
                Active Only
              </Button>
              <Button
                type='button'
                variant={bayFilter === 'booth' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setBayFilter('booth')}
                className={`h-7 px-2.5 text-xs font-medium transition ${
                  bayFilter === 'booth'
                    ? 'bg-[#1a1f2e] text-white hover:bg-[#22283a]'
                    : 'text-slate-400 hover:bg-[#141824] hover:text-white'
                }`}
              >
                Booth Queue
              </Button>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className='border-b border-[#242a3e] bg-[#0a0c10]/60 hover:bg-[#0a0c10]/60'>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>Job ID</TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Vehicle &amp; Irish Reg
              </TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>Customer</TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Current Phase
              </TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Assigned Tech / Bay
              </TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>Progress</TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Due Target
              </TableHead>
              <TableHead className='text-right font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-[#242a3e]'>
            {filteredJobs.map((job) => (
              <TableRow key={job.id} className='border-b border-[#242a3e] transition hover:bg-[#141824]/50'>
                <TableCell className='font-mono font-medium whitespace-nowrap text-red-400'>{job.id}</TableCell>
                <TableCell className='whitespace-nowrap'>
                  <div className='flex items-center gap-2.5'>
                    <div className='inline-flex items-center overflow-hidden rounded border border-slate-700 bg-[#0a0c10] font-mono text-[10px] leading-none font-bold shadow-xs'>
                      <span className='bg-blue-800 px-1 py-1 text-[8px] text-white'>IRL</span>
                      <span className='px-1.5 py-1 text-slate-200'>{job.regNumber}</span>
                    </div>
                    <span className='font-semibold text-white'>{job.vehicleModel}</span>
                  </div>
                </TableCell>
                <TableCell className='font-medium text-slate-300'>{job.contactName}</TableCell>
                <TableCell className='whitespace-nowrap'>
                  <Badge
                    variant='outline'
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      job.status === 'Completed'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : job.status === 'Work in Progress'
                          ? 'border-red-500/20 bg-red-500/10 text-red-400'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        job.status === 'Completed'
                          ? 'bg-emerald-500'
                          : job.status === 'Work in Progress'
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                      }`}
                    />
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='font-medium text-white'>{job.assignedTech || 'Unassigned'}</div>
                  <div className='font-mono text-[10px] text-slate-400'>{job.bay || 'General Intake'}</div>
                </TableCell>
                <TableCell>
                  <div className='w-24'>
                    <div className='mb-1 flex items-center justify-between font-mono text-[10px] text-slate-400'>
                      <span>{job.progressPercent}%</span>
                    </div>
                    <Progress value={job.progressPercent} className='h-1.5 bg-[#1a1f2e]' />
                  </div>
                </TableCell>
                <TableCell className='font-mono text-slate-300'>{job.dueTarget}</TableCell>
                <TableCell className='text-right whitespace-nowrap'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => onSelectCustomer(job)}
                    className='border-[#242a3e] bg-[#1a1f2e] text-[11px] font-medium text-sky-400 hover:bg-[#22283a] hover:text-sky-300'
                  >
                    Inspect Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Secondary Panels: 30-Day Volume Chart + Facility Hardware Telemetry */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        {/* Left: 30-Day Throughput SVG Area Chart */}
        <Card className='flex flex-col justify-between border-[#242a3e] bg-[#0f1219] p-5 text-slate-200 lg:col-span-7'>
          <div>
            <div className='mb-1 flex items-center justify-between'>
              <span className='font-mono text-[11px] font-semibold tracking-wider text-slate-400 uppercase'>
                Throughput Analytics
              </span>
              <div className='flex items-center gap-4 text-xs'>
                <div className='flex items-center gap-1.5'>
                  <span className='size-2.5 rounded-full bg-sky-400' />
                  <span className='text-slate-300'>Intake Inquiries</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='size-2.5 rounded-full bg-red-500' />
                  <span className='text-slate-300'>Approved Jobs</span>
                </div>
              </div>
            </div>
            <h3 className='text-base font-bold tracking-tight text-white'>30-Day Volume &amp; Conversion Dynamics</h3>
          </div>

          <div className='relative my-4 flex h-48 w-full items-end'>
            <svg className='h-full w-full overflow-visible' preserveAspectRatio='none' viewBox='0 0 500 160'>
              <defs>
                <linearGradient id='skyGrad' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='0%' stopColor='#38bdf8' stopOpacity='0.25' />
                  <stop offset='100%' stopColor='#38bdf8' stopOpacity='0.0' />
                </linearGradient>
                <linearGradient id='redGrad' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='0%' stopColor='#dc2626' stopOpacity='0.25' />
                  <stop offset='100%' stopColor='#dc2626' stopOpacity='0.0' />
                </linearGradient>
              </defs>
              <line stroke='#1f2537' strokeDasharray='3,3' strokeWidth='1' x1='0' x2='500' y1='20' y2='20' />
              <line stroke='#1f2537' strokeDasharray='3,3' strokeWidth='1' x1='0' x2='500' y1='60' y2='60' />
              <line stroke='#1f2537' strokeDasharray='3,3' strokeWidth='1' x1='0' x2='500' y1='100' y2='100' />
              <line stroke='#242a3e' strokeWidth='1' x1='0' x2='500' y1='140' y2='140' />

              {/* Sky Blue Line & Area (Intake Volume) */}
              <polygon
                fill='url(#skyGrad)'
                points='0,140 0,105 50,90 100,100 150,75 200,55 250,70 300,45 350,38 400,30 450,22 500,18 500,140'
              />
              <polyline
                fill='none'
                points='0,105 50,90 100,100 150,75 200,55 250,70 300,45 350,38 400,30 450,22 500,18'
                stroke='#38bdf8'
                strokeWidth='2'
              />

              {/* Red Line & Area (Approved Jobs) */}
              <polygon
                fill='url(#redGrad)'
                points='0,140 0,130 50,125 100,120 150,105 200,85 250,90 300,70 350,60 400,50 450,38 500,32 500,140'
              />
              <polyline
                fill='none'
                points='0,130 50,125 100,120 150,105 200,85 250,90 300,70 350,60 400,50 450,38 500,32'
                stroke='#dc2626'
                strokeWidth='2'
              />

              <circle cx='450' cy='22' fill='#38bdf8' r='3.5' stroke='#0f1219' strokeWidth='2' />
              <circle cx='450' cy='38' fill='#dc2626' r='3.5' stroke='#0f1219' strokeWidth='2' />
            </svg>
          </div>

          <div className='flex items-center justify-between border-t border-[#1a1f2e] pt-2 font-mono text-[10px] text-slate-500'>
            <span>05 AUG</span>
            <span>12 AUG</span>
            <span>19 AUG</span>
            <span>26 AUG</span>
            <span>02 SEP</span>
            <span className='font-bold text-sky-400'>TODAY (04 SEP)</span>
          </div>
        </Card>

        {/* Right: Real-time Facility Hardware Telemetry */}
        <Card className='flex flex-col justify-between border-[#242a3e] bg-[#0f1219] p-5 text-slate-200 lg:col-span-5'>
          <div>
            <div className='mb-1 flex items-center justify-between'>
              <span className='font-mono text-[11px] font-semibold tracking-wider text-slate-400 uppercase'>
                Equipment Status
              </span>
              <Badge
                variant='outline'
                className='inline-flex items-center gap-1.5 border-emerald-500/20 bg-emerald-500/10 font-mono text-[10px] text-emerald-400'
              >
                <span className='size-1.5 rounded-full bg-emerald-400' />
                All Systems Calibrated
              </Badge>
            </div>
            <h3 className='text-base font-bold tracking-tight text-white'>
              Facility Hardware &amp; Environmental Telemetry
            </h3>
          </div>

          <div className='my-3 space-y-3'>
            <div className='flex items-center justify-between rounded-lg border border-[#242a3e] bg-[#0a0c10] p-3'>
              <div className='flex items-center gap-3'>
                <div className='size-2 animate-pulse rounded-full bg-red-500' />
                <div>
                  <div className='text-xs font-bold text-white'>Spray Booth 1 (Blowtherm)</div>
                  <div className='text-[11px] text-slate-400'>Bake Cycle • Porsche 911 Carrera</div>
                </div>
              </div>
              <div className='text-right'>
                <div className='font-mono text-xs font-bold text-red-400'>68°C / 70°C</div>
                <div className='font-mono text-[10px] text-slate-500'>18 mins remaining</div>
              </div>
            </div>

            <div className='flex items-center justify-between rounded-lg border border-[#242a3e] bg-[#0a0c10] p-3'>
              <div className='flex items-center gap-3'>
                <div className='size-2 rounded-full bg-emerald-400' />
                <div>
                  <div className='text-xs font-bold text-white'>Spray Booth 2 (Blowtherm)</div>
                  <div className='text-[11px] text-slate-400'>Extraction Ready • Negative Pressure OK</div>
                </div>
              </div>
              <div className='text-right'>
                <div className='font-mono text-xs font-bold text-emerald-400'>Standby</div>
                <div className='font-mono text-[10px] text-slate-500'>Next: Tesla Model Y</div>
              </div>
            </div>

            <div className='flex items-center justify-between rounded-lg border border-[#242a3e] bg-[#0a0c10] p-3'>
              <div className='flex items-center gap-3'>
                <div className='size-2 rounded-full bg-sky-400' />
                <div>
                  <div className='text-xs font-bold text-white'>Celette Laser Alignment Rig</div>
                  <div className='text-[11px] text-slate-400'>
                    Deviation: <span className='font-mono text-sky-300'>±0.12mm (Within OEM Spec)</span>
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <div className='font-mono text-xs font-bold text-sky-400'>Certified</div>
                <div className='font-mono text-[10px] text-slate-500'>NCT Compliant</div>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between border-t border-[#1a1f2e] pt-2 text-[11px]'>
            <span className='text-slate-400'>Direct Insurer Partners:</span>
            <span className='font-mono text-slate-300'>Allianz • AXA Ireland • Aviva • Zurich</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
