'use client';

import { Search, Calendar, Bell, Plus } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenNewEnquiry: () => void;
}

export function AdminHeader({ searchQuery, setSearchQuery, onOpenNewEnquiry }: AdminHeaderProps) {
  return (
    <header className='sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#242a3e] bg-[#0f1219]/90 px-6 backdrop-blur-md'>
      {/* Left: Sidebar Trigger & Search Bar */}
      <div className='flex max-w-lg flex-1 items-center gap-4'>
        <SidebarTrigger className='text-slate-400 hover:bg-[#141824] hover:text-white' />

        <div className='relative flex flex-1 items-center'>
          <Search className='pointer-events-none absolute left-3.5 z-10 size-4 text-slate-400' />
          <Input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search job ID, reg number (e.g. 241-D-12345), customer name...'
            className='w-full border-[#242a3e] bg-[#0a0c10] py-2 pr-14 pl-10 text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
          />
          <kbd className='pointer-events-none absolute right-3 rounded border border-[#242a3e] bg-[#141824] px-1.5 py-0.5 font-mono text-[10px] text-slate-400'>
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Tools & Context */}
      <div className='ml-6 flex items-center gap-3'>
        {/* Location Picker Badge */}
        <Badge
          variant='outline'
          className='hidden items-center gap-2 border-[#242a3e] bg-[#141824] px-3 py-1.5 font-mono text-xs text-slate-300 md:flex'
        >
          <span className='size-2 rounded-full bg-emerald-400' />
          <span>Dublin HQ • Unit 4B</span>
        </Badge>

        {/* Date Display */}
        <Badge
          variant='outline'
          className='hidden items-center gap-2 border-[#242a3e] bg-[#141824] px-3 py-1.5 font-mono text-xs text-slate-300 lg:flex'
        >
          <Calendar className='size-3.5 text-slate-400' />
          <span>04 Sep 2026</span>
        </Badge>

        {/* Notification Bell */}
        <Button
          type='button'
          variant='outline'
          size='icon-sm'
          className='relative border-[#242a3e] bg-[#141824] text-slate-400 hover:bg-[#1a1f2e] hover:text-white'
          title='Notifications'
        >
          <Bell className='size-4' />
          <span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-[#141824]' />
        </Button>

        {/* CTA Action: New Enquiry */}
        <Button
          type='button'
          size='sm'
          onClick={onOpenNewEnquiry}
          className='flex items-center gap-2 bg-red-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-red-900/30 hover:bg-red-700'
        >
          <Plus className='size-4' />
          <span>New Enquiry</span>
        </Button>
      </div>
    </header>
  );
}
