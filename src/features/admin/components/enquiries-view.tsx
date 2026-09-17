'use client';

import { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CustomerRecord, IntakeChannel } from '../types';

interface EnquiriesViewProps {
  customers: CustomerRecord[];
  onOpenNewEnquiry: () => void;
  onSelectCustomer: (c: CustomerRecord) => void;
}

const CHANNELS: (IntakeChannel | 'All')[] = [
  'All',
  'Website Form',
  'Direct Phone Call',
  'WhatsApp',
  'Email',
  'Facebook / Social',
  'Walk-ins',
];

export function EnquiriesView({ customers, onOpenNewEnquiry, onSelectCustomer }: EnquiriesViewProps) {
  const [selectedChannel, setSelectedChannel] = useState<IntakeChannel | 'All'>('All');

  const filtered = customers.filter((c) => {
    if (selectedChannel === 'All') return true;
    return c.channel === selectedChannel;
  });

  return (
    <div className='space-y-6'>
      {/* Title */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='border-red-500/30 bg-red-500/10 font-mono text-[11px] tracking-wider text-red-400 uppercase'
            >
              PDF Module 1 • Intake Channels
            </Badge>
          </div>
          <h1 className='mt-1 text-2xl font-bold tracking-tight text-white'>New Customer Enquiries</h1>
          <p className='text-xs text-slate-400'>
            Capture and route inquiries across 6 active intake channels in real-time.
          </p>
        </div>

        <Button
          type='button'
          size='sm'
          onClick={onOpenNewEnquiry}
          className='flex items-center gap-2 bg-red-600 px-4 text-xs font-semibold text-white shadow-md shadow-red-900/30 hover:bg-red-700'
        >
          <Plus className='size-4' />
          <span>Log New Enquiry</span>
        </Button>
      </div>

      {/* 6 Intake Channel Filter Pills */}
      <div className='flex flex-wrap items-center gap-2 rounded-xl border border-[#242a3e] bg-[#0f1219] p-2'>
        {CHANNELS.map((ch) => {
          const count = ch === 'All' ? customers.length : customers.filter((c) => c.channel === ch).length;
          const isSelected = selectedChannel === ch;

          return (
            <Button
              key={ch}
              type='button'
              variant={isSelected ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setSelectedChannel(ch)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs transition ${
                isSelected
                  ? 'border border-red-500/30 bg-red-500/20 text-white hover:bg-red-500/30'
                  : 'text-slate-400 hover:bg-[#141824] hover:text-white'
              }`}
            >
              <span>{ch}</span>
              <Badge
                variant='outline'
                className={`ml-1 px-1.5 py-0 font-mono text-[10px] ${
                  isSelected ? 'border-red-400 bg-red-600 text-white' : 'border-transparent bg-[#1a1f2e] text-slate-400'
                }`}
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Enquiries Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filtered.map((item) => (
          <Card
            key={item.id}
            onClick={() => onSelectCustomer(item)}
            className='group cursor-pointer border-[#242a3e] bg-[#0f1219] text-slate-200 transition hover:border-red-500/50 hover:shadow-lg'
          >
            <CardContent className='p-5'>
              <div className='flex items-center justify-between'>
                <Badge
                  variant='outline'
                  className='border-[#242a3e] bg-[#0a0c10] font-mono text-[11px] font-semibold text-red-400'
                >
                  {item.id}
                </Badge>
                <Badge variant='outline' className='border-[#242a3e] bg-[#141824] font-mono text-[10px] text-slate-400'>
                  {item.channel}
                </Badge>
              </div>

              <div className='mt-3'>
                <div className='text-base font-bold text-white transition-colors group-hover:text-red-400'>
                  {item.contactName}
                </div>
                <div className='text-xs text-slate-400'>{item.phone}</div>
              </div>

              <div className='mt-3 flex items-center gap-2 rounded border border-[#242a3e] bg-[#0a0c10] p-2'>
                <div className='inline-flex items-center overflow-hidden rounded border border-slate-700 bg-black font-mono text-[9px] leading-none font-bold'>
                  <span className='bg-blue-800 px-1 py-0.5 text-[7px] text-white'>IRL</span>
                  <span className='px-1.5 py-0.5 text-slate-200'>{item.regNumber}</span>
                </div>
                <span className='truncate text-xs font-semibold text-white'>{item.vehicleModel}</span>
              </div>

              <p className='mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400'>{item.serviceScope}</p>

              <div className='mt-4 flex items-center justify-between border-t border-[#1a1f2e] pt-3 text-xs'>
                <span className='font-mono font-semibold text-emerald-400'>
                  Est: €{item.estimateValue.toLocaleString()}
                </span>
                <span className='flex items-center gap-1 text-[11px] text-sky-400 transition-transform group-hover:translate-x-1'>
                  Open Record <ArrowRight className='size-3' />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
