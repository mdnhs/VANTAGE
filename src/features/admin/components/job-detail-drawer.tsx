'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CustomerRecord, PipelineStatus } from '../types';

interface JobDetailDrawerProps {
  record: CustomerRecord | null;
  onClose: () => void;
  onUpdateRecord: (updated: CustomerRecord) => void;
}

const LIFECYCLE_STEPS = [
  { step: 1, title: 'Enquiry Received', detail: 'Logged into system' },
  { step: 2, title: 'Customer Contacted', detail: 'Assessment & details confirmed' },
  { step: 3, title: 'Inspection & Quote', detail: 'Pricing presented' },
  { step: 4, title: 'Work Approved & Executed', detail: 'Delivery in progress' },
  { step: 5, title: 'Handover & Payment', detail: 'Job closed' },
];

const ALL_STATUSES: PipelineStatus[] = [
  'New',
  'Contacted',
  'Waiting for Response',
  'Quote Sent',
  'Approved',
  'Work in Progress',
  'Completed',
  'Cancelled',
];

export function JobDetailDrawer({ record, onClose, onUpdateRecord }: JobDetailDrawerProps) {
  const [newNote, setNewNote] = useState('');

  if (!record) return null;

  const handleAdvanceMilestone = (newMilestone: 1 | 2 | 3 | 4 | 5) => {
    onUpdateRecord({
      ...record,
      currentMilestone: newMilestone,
      status:
        newMilestone === 5
          ? 'Completed'
          : newMilestone === 4
            ? 'Work in Progress'
            : newMilestone === 3
              ? 'Quote Sent'
              : newMilestone === 2
                ? 'Contacted'
                : 'New',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleStatusChange = (status: PipelineStatus) => {
    onUpdateRecord({
      ...record,
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onUpdateRecord({
      ...record,
      customNotes: [
        ...record.customNotes,
        `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${newNote.trim()}`,
      ],
      updatedAt: new Date().toISOString(),
    });
    setNewNote('');
  };

  return (
    <Sheet
      open={Boolean(record)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side='right'
        className='flex w-full flex-col overflow-y-auto border-l border-[#242a3e] bg-[#0f1219] p-6 text-slate-200 sm:max-w-xl'
      >
        {/* Top bar header */}
        <SheetHeader className='border-b border-[#242a3e] pb-4 text-left'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='border-red-500/30 bg-red-500/10 font-mono text-xs text-red-400'>
              {record.id}
            </Badge>
            <Badge variant='outline' className='border-[#242a3e] bg-[#141824] font-mono text-[10px] text-slate-400'>
              {record.channel}
            </Badge>
          </div>
          <SheetTitle className='mt-1 text-lg font-bold text-white'>{record.vehicleModel}</SheetTitle>
          <SheetDescription className='text-xs text-slate-400'>
            Customer: {record.contactName} • Claim/Scope: {record.serviceScope}
          </SheetDescription>
        </SheetHeader>

        {/* Irish Reg Plate & Status Controls */}
        <div className='mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#242a3e] bg-[#0a0c10] p-3'>
          <div className='inline-flex items-center overflow-hidden rounded border border-slate-700 bg-black font-mono text-xs font-bold shadow-sm'>
            <span className='bg-blue-800 px-1.5 py-1 text-[9px] text-white'>IRL</span>
            <span className='px-2.5 py-1 tracking-widest text-white'>{record.regNumber}</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-xs text-slate-400'>Pipeline Status:</span>
            <select
              value={record.status}
              aria-label='Pipeline Status'
              onChange={(e) => handleStatusChange(e.target.value as PipelineStatus)}
              className='rounded-md border border-[#242a3e] bg-[#141824] px-2.5 py-1 font-mono text-xs text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none'
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PDF Module 3: Customer Follow-up & Lifecycle (5 Milestones) */}
        <Card className='mt-4 border-[#242a3e] bg-[#141824] text-slate-200'>
          <CardContent className='p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <span className='font-mono text-[11px] font-bold tracking-wider text-slate-400 uppercase'>
                Lifecycle Milestone Progression
              </span>
              <Badge variant='outline' className='border-red-500/30 bg-red-500/15 font-mono text-[10px] text-red-400'>
                Step {record.currentMilestone} of 5
              </Badge>
            </div>

            <div className='space-y-2'>
              {LIFECYCLE_STEPS.map((stepItem) => {
                const isDone = stepItem.step <= record.currentMilestone;
                const isCurrent = stepItem.step === record.currentMilestone;

                return (
                  <div
                    key={stepItem.step}
                    onClick={() => handleAdvanceMilestone(stepItem.step as 1 | 2 | 3 | 4 | 5)}
                    className={`flex cursor-pointer items-center justify-between rounded-md p-2.5 transition ${
                      isCurrent
                        ? 'border border-red-500/40 bg-red-950/20 text-white'
                        : isDone
                          ? 'bg-[#0f1219] text-slate-200'
                          : 'bg-[#0f1219]/40 text-slate-500 hover:bg-[#0f1219]'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <span
                        className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          isDone ? 'bg-red-600 text-white' : 'bg-[#242a3e] text-slate-400'
                        }`}
                      >
                        {stepItem.step}
                      </span>
                      <div>
                        <div className='text-xs font-semibold'>{stepItem.title}</div>
                        <div className='text-[10px] text-slate-400'>{stepItem.detail}</div>
                      </div>
                    </div>
                    {isDone && <CheckCircle2 className='size-4 text-emerald-400' />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* PDF Module 2: Customer Information & Records */}
        <div className='mt-5 space-y-4 text-xs'>
          <span className='font-mono text-[11px] font-bold tracking-wider text-slate-400 uppercase'>
            Profile &amp; Technical Records
          </span>

          <div className='grid grid-cols-2 gap-3 rounded-lg border border-[#242a3e] bg-[#0a0c10] p-4'>
            <div>
              <span className='text-slate-500'>Contact Name:</span>
              <div className='font-bold text-white'>{record.contactName}</div>
            </div>
            <div>
              <span className='text-slate-500'>Phone Number:</span>
              <div className='font-mono text-slate-300'>{record.phone}</div>
            </div>
            <div>
              <span className='text-slate-500'>Email Address:</span>
              <div className='truncate text-slate-300'>{record.email}</div>
            </div>
            <div>
              <span className='text-slate-500'>Dublin Address:</span>
              <div className='truncate text-slate-300'>{record.address}</div>
            </div>
            <div>
              <span className='text-slate-500'>Paint Code:</span>
              <div className='font-mono text-slate-300'>{record.paintCode || 'N/A'}</div>
            </div>
            <div>
              <span className='text-slate-500'>Estimated Value:</span>
              <div className='font-mono font-bold text-emerald-400'>€{record.estimateValue.toLocaleString()}</div>
            </div>
          </div>

          <div>
            <span className='text-slate-500'>Service Scope:</span>
            <p className='mt-1 rounded-md border border-[#242a3e] bg-[#0a0c10] p-2.5 text-slate-300'>
              {record.serviceScope}
            </p>
          </div>

          {/* Photos */}
          {record.photos && record.photos.length > 0 && (
            <div>
              <span className='text-slate-500'>Damage &amp; Repair Documentation:</span>
              <div className='mt-2 flex gap-3 overflow-x-auto pb-1'>
                {record.photos.map((ph, idx) => (
                  <div
                    key={idx}
                    className='relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-[#242a3e]'
                  >
                    <Image src={ph} alt='Damage inspection photo' fill className='object-cover' />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Notes & Audit with ScrollArea */}
          <div>
            <span className='text-slate-500'>Custom Notes &amp; Activity Log:</span>
            <ScrollArea className='mt-2 h-36 rounded-md border border-[#242a3e] bg-[#0a0c10] p-3 font-mono text-[11px]'>
              <div className='space-y-1.5'>
                {record.customNotes.map((nt, idx) => (
                  <div key={idx} className='text-slate-300'>
                    • {nt}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <form onSubmit={handleAddNote} className='mt-2 flex gap-2'>
              <Input
                type='text'
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder='Add note (e.g. loss adjuster signed off)...'
                className='flex-1 border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
              />
              <Button type='submit' size='sm' className='bg-red-600 text-xs font-semibold text-white hover:bg-red-700'>
                Add
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
