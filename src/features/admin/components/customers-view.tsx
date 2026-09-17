'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CustomerRecord } from '../types';

interface CustomersViewProps {
  customers: CustomerRecord[];
  onSelectCustomer: (c: CustomerRecord) => void;
}

export function CustomersView({ customers, onSelectCustomer }: CustomersViewProps) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.vehicleModel.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='border-red-500/30 bg-red-500/10 font-mono text-[11px] tracking-wider text-red-400 uppercase'
            >
              PDF Module 2 • Customer Information &amp; Records
            </Badge>
          </div>
          <h1 className='mt-1 text-2xl font-bold tracking-tight text-white'>Customer Profiles &amp; Vehicle Assets</h1>
          <p className='text-xs text-slate-400'>
            Essential records: Contact details, Dublin addresses, Irish registration plates, service scope, photos, and
            custom notes.
          </p>
        </div>

        <div className='relative w-72'>
          <Search className='pointer-events-none absolute top-2.5 left-3 z-10 size-4 text-slate-400' />
          <Input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Filter by name, reg plate, email...'
            className='w-full border-[#242a3e] bg-[#0f1219] pl-9 text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className='overflow-hidden rounded-xl border border-[#242a3e] bg-[#0f1219]'>
        <Table>
          <TableHeader>
            <TableRow className='border-b border-[#242a3e] bg-[#0a0c10]/60 hover:bg-[#0a0c10]/60'>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>Customer</TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Phone &amp; Email
              </TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Full Dublin Address
              </TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Vehicle Asset (Irish Reg)
              </TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Service Scope
              </TableHead>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Notes / Photos
              </TableHead>
              <TableHead className='text-right font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-[#242a3e]'>
            {filtered.map((c) => {
              const initials = c.contactName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <TableRow key={c.id} className='border-b border-[#242a3e] transition hover:bg-[#141824]/50'>
                  <TableCell className='py-3.5'>
                    <div className='flex items-center gap-2.5'>
                      <Avatar className='size-8 border border-[#242a3e] bg-[#141824]'>
                        <AvatarFallback className='bg-red-950/80 text-xs font-bold text-red-400'>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-bold text-white'>{c.contactName}</div>
                        <div className='font-mono text-[10px] text-slate-500'>Channel: {c.channel}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className='py-3.5'>
                    <div className='font-mono text-slate-300'>{c.phone}</div>
                    <div className='text-[11px] text-slate-500'>{c.email}</div>
                  </TableCell>

                  <TableCell className='max-w-[200px] truncate py-3.5 text-slate-300'>{c.address}</TableCell>

                  <TableCell className='py-3.5 whitespace-nowrap'>
                    <div className='flex items-center gap-2'>
                      <div className='inline-flex items-center overflow-hidden rounded border border-slate-700 bg-black font-mono text-[9px] leading-none font-bold shadow-xs'>
                        <span className='bg-blue-800 px-1 py-0.5 text-[7px] text-white'>IRL</span>
                        <span className='px-1.5 py-0.5 text-slate-200'>{c.regNumber}</span>
                      </div>
                      <span className='font-medium text-white'>{c.vehicleModel}</span>
                    </div>
                    {c.paintCode && (
                      <div className='mt-0.5 font-mono text-[10px] text-slate-400'>Paint: {c.paintCode}</div>
                    )}
                  </TableCell>

                  <TableCell className='max-w-[220px] truncate py-3.5 text-slate-400'>{c.serviceScope}</TableCell>

                  <TableCell className='py-3.5'>
                    <div className='flex items-center gap-2 font-mono text-[11px] text-slate-400'>
                      <Badge
                        variant='outline'
                        className='border-[#242a3e] bg-[#141824] px-1.5 py-0 text-[10px] text-slate-300'
                      >
                        {c.customNotes.length} notes
                      </Badge>
                      <Badge
                        variant='outline'
                        className='border-[#242a3e] bg-[#141824] px-1.5 py-0 text-[10px] text-slate-300'
                      >
                        {c.photos.length} photos
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className='py-3.5 text-right whitespace-nowrap'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => onSelectCustomer(c)}
                      className='border-[#242a3e] bg-[#1a1f2e] text-xs font-medium text-sky-400 hover:bg-[#22283a] hover:text-sky-300'
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
