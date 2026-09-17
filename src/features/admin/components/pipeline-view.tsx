'use client';

import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CustomerRecord, PipelineStatus } from '../types';

interface PipelineViewProps {
  customers: CustomerRecord[];
  onSelectCustomer: (c: CustomerRecord) => void;
  onUpdateStatus: (id: string, newStatus: PipelineStatus) => void;
}

const PIPELINE_COLUMNS: {
  status: PipelineStatus;
  badgeBg: string;
  badgeText: string;
}[] = [
  { status: 'New', badgeBg: 'bg-blue-500/20', badgeText: 'text-blue-400' },
  { status: 'Contacted', badgeBg: 'bg-sky-500/20', badgeText: 'text-sky-400' },
  { status: 'Waiting for Response', badgeBg: 'bg-amber-500/20', badgeText: 'text-amber-400' },
  { status: 'Quote Sent', badgeBg: 'bg-purple-500/20', badgeText: 'text-purple-400' },
  { status: 'Approved', badgeBg: 'bg-emerald-500/20', badgeText: 'text-emerald-400' },
  { status: 'Work in Progress', badgeBg: 'bg-red-500/20', badgeText: 'text-red-400' },
  { status: 'Completed', badgeBg: 'bg-emerald-600/30', badgeText: 'text-emerald-300' },
  { status: 'Cancelled', badgeBg: 'bg-slate-700/40', badgeText: 'text-slate-400' },
];

export function PipelineView({ customers, onSelectCustomer, onUpdateStatus }: PipelineViewProps) {
  return (
    <div className='space-y-6'>
      {/* Title */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='border-red-500/30 bg-red-500/10 font-mono text-[11px] tracking-wider text-red-400 uppercase'
            >
              PDF Module 4 • Pipeline Telemetry
            </Badge>
          </div>
          <h1 className='mt-1 text-2xl font-bold tracking-tight text-white'>Customer &amp; Job Status Tracking</h1>
          <p className='text-xs text-slate-400'>
            8 real-time pipeline states visible at any moment. Click cards to inspect full records or advance status.
          </p>
        </div>

        <Badge variant='outline' className='border-[#242a3e] bg-[#141824] px-3 py-1.5 font-mono text-xs text-slate-300'>
          <span>Total Tracked:</span>
          <strong className='ml-1 text-white'>{customers.length} Jobs</strong>
        </Badge>
      </div>

      {/* 8-Column Pipeline Kanban Horizontal Board */}
      <div className='flex gap-4 overflow-x-auto pb-4'>
        {PIPELINE_COLUMNS.map((col) => {
          const colJobs = customers.filter((c) => c.status === col.status);
          const colTotalValue = colJobs.reduce((acc, c) => acc + c.estimateValue, 0);

          return (
            <Card
              key={col.status}
              className='flex w-72 shrink-0 flex-col border-[#242a3e] bg-[#0f1219] text-slate-200 shadow-sm'
            >
              {/* Column Header */}
              <div className='flex items-center justify-between border-b border-[#242a3e] p-3.5'>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className={`font-mono text-[10px] font-bold uppercase ${col.badgeBg} ${col.badgeText}`}
                  >
                    {col.status}
                  </Badge>
                  <span className='font-mono text-xs text-slate-400'>({colJobs.length})</span>
                </div>
                {colTotalValue > 0 && (
                  <span className='font-mono text-[10px] text-slate-400'>€{colTotalValue.toLocaleString()}</span>
                )}
              </div>

              {/* Job Cards */}
              <ScrollArea className='h-[520px] flex-1 p-3'>
                <div className='space-y-3'>
                  {colJobs.length === 0 ? (
                    <div className='flex h-32 items-center justify-center rounded-lg border border-dashed border-[#242a3e] p-4 text-center font-mono text-xs text-slate-600'>
                      No jobs currently in {col.status}
                    </div>
                  ) : (
                    colJobs.map((job) => (
                      <Card
                        key={job.id}
                        onClick={() => onSelectCustomer(job)}
                        className='cursor-pointer border-[#242a3e] bg-[#0a0c10] text-slate-200 transition-all hover:border-red-500/50 hover:shadow-lg hover:shadow-red-950/20'
                      >
                        <CardContent className='p-3.5'>
                          <div className='flex items-center justify-between font-mono text-[10px]'>
                            <Badge
                              variant='outline'
                              className='border-transparent bg-red-950/40 px-1 py-0 font-semibold text-red-400'
                            >
                              {job.id}
                            </Badge>
                            <span className='text-slate-500'>{job.channel}</span>
                          </div>

                          {/* Vehicle & Plate */}
                          <div className='mt-2 flex items-center gap-2'>
                            <div className='inline-flex items-center overflow-hidden rounded border border-slate-700 bg-black font-mono text-[9px] leading-none font-bold shadow-xs'>
                              <span className='bg-blue-800 px-1 py-0.5 text-[7px] text-white'>IRL</span>
                              <span className='px-1.5 py-0.5 text-slate-200'>{job.regNumber}</span>
                            </div>
                            <span className='truncate text-xs font-bold text-white'>{job.vehicleModel}</span>
                          </div>

                          <div className='mt-1 text-xs text-slate-400'>{job.contactName}</div>

                          <div className='mt-3 flex items-center justify-between border-t border-[#1a1f2e] pt-2 text-[11px]'>
                            <span className='font-mono font-semibold text-emerald-400'>
                              €{job.estimateValue.toLocaleString()}
                            </span>
                            <div className='flex items-center gap-2'>
                              <Badge
                                variant='outline'
                                className='border-[#242a3e] bg-[#141824] px-1 py-0 font-mono text-[9px] text-slate-400'
                              >
                                Step {job.currentMilestone}/5
                              </Badge>
                              {col.status !== 'Completed' && col.status !== 'Cancelled' && (
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon-xs'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIndex = PIPELINE_COLUMNS.findIndex((p) => p.status === col.status) + 1;
                                    if (nextIndex < PIPELINE_COLUMNS.length - 1) {
                                      onUpdateStatus(job.id, PIPELINE_COLUMNS[nextIndex].status);
                                    }
                                  }}
                                  className='h-6 w-6 p-0 text-slate-400 hover:bg-[#1a1f2e] hover:text-white'
                                  title='Advance to next stage'
                                >
                                  <ArrowRight className='size-3 text-red-400' />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
