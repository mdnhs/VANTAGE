'use client';

import Link from 'next/link';
import { Inbox, Users, GitBranch, Kanban, ShieldCheck, BarChart3, LayoutDashboard, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

export type AdminTab = 'overview' | 'enquiries' | 'customers' | 'lifecycle' | 'pipeline' | 'staff' | 'reports';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  enquiriesCount: number;
  activeJobsCount: number;
}

const MENU_ITEMS = [
  {
    id: 'enquiries' as AdminTab,
    title: 'New Customer Enquiries',
    icon: Inbox,
    badgeKey: 'enquiries',
  },
  {
    id: 'customers' as AdminTab,
    title: 'Customer Information & Records',
    icon: Users,
  },
  {
    id: 'lifecycle' as AdminTab,
    title: 'Customer Follow-up & Lifecycle',
    icon: GitBranch,
  },
  {
    id: 'pipeline' as AdminTab,
    title: 'Customer & Job Status Tracking',
    icon: Kanban,
    badgeKey: 'jobs',
  },
  {
    id: 'staff' as AdminTab,
    title: 'Staff Access & Permissions',
    icon: ShieldCheck,
  },
  {
    id: 'reports' as AdminTab,
    title: 'Reports & Management Overview',
    icon: BarChart3,
  },
];

export function AppSidebar({ activeTab, setActiveTab, enquiriesCount, activeJobsCount }: AdminSidebarProps) {
  return (
    <Sidebar collapsible='icon' className='border-r border-[#242a3e] bg-[#0f1219] text-slate-200'>
      {/* Sidebar Brand Header */}
      <SidebarHeader className='h-16 border-b border-[#242a3e] bg-[#0a0c10]/40 px-4 group-data-[collapsible=icon]:px-2'>
        <div className='flex h-full items-center gap-3 group-data-[collapsible=icon]:justify-center'>
          <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-sm font-black text-white shadow-lg shadow-red-900/30'>
            VA
          </div>
          <div className='flex min-w-0 flex-col group-data-[collapsible=icon]:hidden'>
            <div className='flex items-center gap-1.5'>
              <span className='text-base leading-none font-extrabold tracking-tight text-white'>VANTAGE</span>
              <span className='rounded border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-red-400 uppercase'>
                AUTO
              </span>
            </div>
            <span className='mt-0.5 font-mono text-[10px] tracking-wide text-slate-400'>Workshop OS v4.2</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className='px-2 py-3 group-data-[collapsible=icon]:px-1'>
        {/* Quick Operations Overview */}
        <SidebarGroup>
          <SidebarGroupLabel className='font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase'>
            Command Center
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  tooltip='Operations Overview'
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    activeTab === 'overview'
                      ? 'border border-red-500/20 bg-red-500/10 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-[#141824] hover:text-white'
                  }`}
                >
                  <LayoutDashboard
                    className={`size-4 shrink-0 ${activeTab === 'overview' ? 'text-red-500' : 'text-slate-400'}`}
                  />
                  <span className='truncate group-data-[collapsible=icon]:hidden'>Operations Overview</span>
                  {activeTab === 'overview' && (
                    <span className='ml-auto size-1.5 animate-pulse rounded-full bg-red-500 group-data-[collapsible=icon]:hidden' />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* The 6 Core Workflow System Menus from PDF (No SL Numbers) */}
        <SidebarGroup className='mt-2'>
          <SidebarGroupLabel className='font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase'>
            Workflow System (6 Modules)
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className='space-y-1'>
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setActiveTab(item.id)}
                      tooltip={item.title}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                        isActive
                          ? 'border border-red-500/20 bg-red-500/10 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-[#141824] hover:text-white'
                      }`}
                    >
                      <Icon className={`size-4 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                      <span className='truncate text-left group-data-[collapsible=icon]:hidden'>{item.title}</span>

                      {item.badgeKey === 'enquiries' && (
                        <span className='ml-auto shrink-0 rounded border border-red-500/30 bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-red-400 group-data-[collapsible=icon]:hidden'>
                          {enquiriesCount}
                        </span>
                      )}

                      {item.badgeKey === 'jobs' && (
                        <span className='ml-auto shrink-0 rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 group-data-[collapsible=icon]:hidden'>
                          {activeJobsCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer: Director Profile */}
      <SidebarFooter className='border-t border-[#242a3e] bg-[#0a0c10]/60 p-3 group-data-[collapsible=icon]:p-2'>
        <div className='flex items-center justify-between rounded-lg border border-[#242a3e] bg-[#141824] p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0'>
          <div className='flex min-w-0 items-center gap-2.5'>
            <div className='relative shrink-0' title="Liam O'Sullivan - Lead Tech / Director">
              <div className='flex size-8 items-center justify-center rounded-full bg-red-950/80 text-xs font-bold text-red-400 ring-1 ring-slate-600'>
                LO
              </div>
              <span className='absolute right-0 bottom-0 size-2 rounded-full bg-emerald-400 ring-2 ring-[#141824]' />
            </div>
            <div className='min-w-0 group-data-[collapsible=icon]:hidden'>
              <div className='truncate text-xs font-bold text-white'>Liam O&apos;Sullivan</div>
              <div className='truncate text-[10px] text-slate-400'>Lead Tech / Director</div>
            </div>
          </div>
          <Link
            href='/'
            className='rounded p-1 text-slate-400 transition group-data-[collapsible=icon]:hidden hover:text-white'
            title='Exit to public site'
          >
            <LogOut className='size-4' />
          </Link>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
