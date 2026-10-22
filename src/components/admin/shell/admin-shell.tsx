'use client';

import { CommandPalette } from '@/components/admin/command/command-palette';
import { CommandPaletteProvider } from '@/components/admin/command/palette-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useNewEnquiriesCount } from '@/features/enquiries/hooks/use-new-enquiries-count';

import { AppSidebar } from './app-sidebar';
import type { Brand } from './brand-mark';
import { SectionRail } from './section-rail';
import { Topbar } from './topbar';

// Floating panels on the canvas with 16px gutters: a 288px sidebar panel
// (20rem minus the container's p-4), the 72px topbar and the content panel.
export function AdminShell({
  defaultOpen,
  siteUrl,
  brand,
  children,
}: {
  defaultOpen: boolean;
  siteUrl: string;
  brand: Brand;
  children: React.ReactNode;
}) {
  const newEnquiries = useNewEnquiriesCount();
  return (
    <TooltipProvider>
      <CommandPaletteProvider>
        <SidebarProvider defaultOpen={defaultOpen} style={{ '--sidebar-width': '20rem' } as React.CSSProperties}>
          <a
            href='#main'
            className='sr-only z-50 rounded-xl bg-card px-4 py-2 text-sm font-semibold shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4'
          >
            Skip to content
          </a>
          <AppSidebar siteUrl={siteUrl} brand={brand} badges={{ 'new-leads': newEnquiries }} />
          {/* The content panel scrolls inside its own rounded corners, below a
            still topbar. --content-h is its visible height (the svh less the
            gutters, the 72px topbar and the gap) for sticky panes inside.
            `relative` makes it the containing block for absolute children
            (sr-only labels, popovers), so they clip and scroll with it
            instead of stretching the document into a second scrollbar. */}
          <div className='flex h-svh min-w-0 flex-1 flex-col gap-4 p-3 [--content-h:calc(100svh-112px)] sm:p-4 sm:[--content-h:calc(100svh-120px)] lg:pl-0'>
            <Topbar />
            <main
              id='main'
              tabIndex={-1}
              className='relative min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-card bg-sidebar p-4 outline-none sm:p-6 lg:p-8'
            >
              <SectionRail>{children}</SectionRail>
            </main>
          </div>
        </SidebarProvider>
        <CommandPalette siteUrl={siteUrl} />
      </CommandPaletteProvider>
    </TooltipProvider>
  );
}
