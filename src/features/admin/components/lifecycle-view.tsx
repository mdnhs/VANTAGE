'use client';

import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CustomerRecord } from '../types';

interface LifecycleViewProps {
  customers: CustomerRecord[];
  onSelectCustomer: (c: CustomerRecord) => void;
  onUpdateCustomer: (updated: CustomerRecord) => void;
}

const MILESTONES = [
  {
    step: 1,
    title: '1. Enquiry Received',
    subtitle: 'Logged into system',
    desc: 'Customer reaches out via 1 of 6 channels. Intake logged with initial vehicle & contact details.',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    step: 2,
    title: '2. Customer Contacted',
    subtitle: 'Assessment / details confirmed',
    desc: 'Front Desk / estimator reaches out within 2hr SLA to confirm vehicle damage and schedule appraisal.',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  },
  {
    step: 3,
    title: '3. Inspection & Quote Provided',
    subtitle: 'Pricing presented',
    desc: 'Diagnostic scans, Celette laser tolerance readings, line-item parts & paint quote submitted to customer/insurer.',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    step: 4,
    title: '4. Work Approved & Executed',
    subtitle: 'Delivery in progress',
    desc: 'Insurer loss adjuster approval, parts delivery, chassis pulling, Blowtherm paint baking, and assembly.',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  {
    step: 5,
    title: '5. Handover & Payment Completed',
    subtitle: 'Job closed',
    desc: '42-point NCT quality check, valet sanitization, lifetime warranty certificate issued, direct billing settled.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
];

export function LifecycleView({ customers, onSelectCustomer, onUpdateCustomer }: LifecycleViewProps) {
  return (
    <div className='space-y-6'>
      {/* Title */}
      <div>
        <div className='flex items-center gap-2'>
          <Badge
            variant='outline'
            className='border-red-500/30 bg-red-500/10 font-mono text-[11px] tracking-wider text-red-400 uppercase'
          >
            PDF Module 3 • Customer Follow-up &amp; Lifecycle
          </Badge>
        </div>
        <h1 className='mt-1 text-2xl font-bold tracking-tight text-white'>
          Customer Lifecycle &amp; Milestone Progression
        </h1>
        <p className='text-xs text-slate-400'>
          Standard 5-stage milestones from initial inquiry to final settlement and vehicle handover.
        </p>
      </div>

      {/* 5 Milestones Horizontal Stepper Header */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        {MILESTONES.map((m) => {
          const atThisStage = customers.filter((c) => c.currentMilestone === m.step);
          const percent = Number(((atThisStage.length / (customers.length || 1)) * 100).toFixed(0));

          return (
            <Card key={m.step} className='flex flex-col justify-between border-[#242a3e] bg-[#0f1219] text-slate-200'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <Badge variant='outline' className={`font-mono text-[10px] font-bold ${m.badgeColor}`}>
                    Stage 0{m.step}
                  </Badge>
                  <span className='font-mono text-xs text-slate-400'>{atThisStage.length} Vehicles</span>
                </div>
                <h3 className='mt-2 text-sm font-bold text-white'>{m.title}</h3>
                <div className='text-[11px] font-medium text-slate-400'>{m.subtitle}</div>
                <p className='mt-2 text-[11px] leading-relaxed text-slate-500'>{m.desc}</p>

                <div className='mt-4 space-y-1 border-t border-[#1a1f2e] pt-2 text-right'>
                  <div className='font-mono text-[10px] text-slate-400'>{percent}% of total</div>
                  <Progress value={percent} className='h-1 bg-[#1a1f2e]' />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Vehicle Records by Lifecycle Milestone */}
      <div className='rounded-xl border border-[#242a3e] bg-[#0f1219] p-5'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-sm font-bold text-white'>Vehicles in Active Lifecycle Milestones</h3>
          <Badge variant='outline' className='border-[#242a3e] bg-[#141824] font-mono text-xs text-slate-400'>
            Showing {customers.length} total customer records
          </Badge>
        </div>

        <div className='space-y-3'>
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCustomer(c)}
              className='flex cursor-pointer flex-col justify-between gap-4 rounded-lg border border-[#242a3e] bg-[#0a0c10] p-4 transition hover:border-red-500/50 hover:bg-[#141824]/40 sm:flex-row sm:items-center'
            >
              <div className='flex items-center gap-3'>
                <div className='inline-flex items-center overflow-hidden rounded border border-slate-700 bg-black font-mono text-[10px] leading-none font-bold shadow-xs'>
                  <span className='bg-blue-800 px-1.5 py-1 text-[8px] text-white'>IRL</span>
                  <span className='px-2 py-1 text-slate-200'>{c.regNumber}</span>
                </div>
                <div>
                  <div className='text-sm font-bold text-white'>{c.vehicleModel}</div>
                  <div className='text-xs text-slate-400'>
                    {c.contactName} • <span className='text-slate-500'>{c.channel}</span>
                  </div>
                </div>
              </div>

              {/* Milestone Step Progress Indicator */}
              <div className='flex items-center gap-2'>
                {[1, 2, 3, 4, 5].map((stepNum) => {
                  const isDone = stepNum <= c.currentMilestone;
                  const isCurrent = stepNum === c.currentMilestone;

                  return (
                    <div key={stepNum} className='flex items-center'>
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateCustomer({
                            ...c,
                            currentMilestone: stepNum as 1 | 2 | 3 | 4 | 5,
                            status:
                              stepNum === 5
                                ? 'Completed'
                                : stepNum === 4
                                  ? 'Work in Progress'
                                  : stepNum === 3
                                    ? 'Quote Sent'
                                    : stepNum === 2
                                      ? 'Contacted'
                                      : 'New',
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className={`flex size-6 items-center justify-center rounded-full font-mono text-[10px] font-bold transition ${
                          isCurrent
                            ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-500/30'
                            : isDone
                              ? 'bg-emerald-600 text-white hover:opacity-80'
                              : 'bg-[#1a1f2e] text-slate-500 hover:bg-[#242a3e] hover:text-white'
                        }`}
                        title={MILESTONES[stepNum - 1].title}
                      >
                        {stepNum}
                      </button>
                      {stepNum < 5 && (
                        <div
                          className={`h-0.5 w-4 sm:w-6 ${
                            stepNum < c.currentMilestone ? 'bg-emerald-600' : 'bg-[#1a1f2e]'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className='flex items-center gap-4 text-xs'>
                <div className='text-right'>
                  <div className='font-mono font-bold text-emerald-400'>€{c.estimateValue.toLocaleString()}</div>
                  <Badge
                    variant='outline'
                    className='border-[#242a3e] bg-[#141824] font-mono text-[10px] text-slate-400'
                  >
                    {c.status}
                  </Badge>
                </div>

                <ChevronRight className='size-4 text-slate-500' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
