'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { createElement } from 'react';
import { usePathname } from 'next/navigation';

import { useInsuranceEnabled } from '@/contexts/insurance-context';
import { useActor } from '@/contexts/actor-provider';
import { activeSection, isActivePath, visibleNav } from '@/lib/admin/nav';
import { cn } from '@/lib/utils';

import { NAV_ICON_FALLBACK, NAV_ICONS } from './nav-icons';

// A section's sub-pages (Website, Enquiries, SEO, Marketing, Site settings) as
// vertical tabs inside the content panel, so the sidebar lists sections only.
// Each section's route layout renders it with its nav id, so the rail stays
// mounted (no flash or shift) while the pages beside it change. Without an id
// it falls back to the section the path is in. From 1024px the tabs stay
// pinned (top-0: the scrolling panel's own padding already sets the gap, and a
// sticky inset is measured inside it) while the page scrolls; below that
// they become a scrolling row above the page.
export function SectionRail({ section: id, children }: { section?: string; children: React.ReactNode }) {
  const { roles } = useActor();
  const pathname = usePathname();
  const opts = { insurance: useInsuranceEnabled() };
  const section = id
    ? visibleNav(roles, opts).find((item) => item.id === id && (item.children?.length ?? 0) > 1)
    : activeSection(pathname, roles, opts);
  if (!section?.children) return children;

  // The deepest tab whose href covers the path wins.
  const current = section.children
    .filter((tab) => isActivePath(pathname, tab))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <div className='flex flex-col gap-6 [--rail-h:3.75rem] lg:flex-row lg:gap-8 lg:[--rail-h:0px]'>
      <nav
        aria-label={section.label}
        className='-mx-1 shrink-0 overflow-x-auto lg:sticky lg:top-0 lg:mx-0 lg:w-52 lg:self-start lg:overflow-visible'
      >
        <p className='mb-2 hidden px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:block'>
          {section.label}
        </p>
        <ul className='flex gap-1 px-1 lg:flex-col lg:px-0'>
          {section.children.map((tab) => {
            const active = tab.id === current?.id;
            return (
              <li key={tab.id} className='relative shrink-0'>
                {active ? (
                  // One highlight per section that slides to the new page (layoutId), with its bar.
                  <motion.span
                    aria-hidden
                    layoutId={`section-rail-${section.id}`}
                    transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                    className='absolute inset-0 rounded-md bg-sidebar-accent'
                  >
                    <span className='absolute top-1/2 left-0 hidden h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary lg:block' />
                  </motion.span>
                ) : null}
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-9 items-center gap-2.5 rounded-md px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
                    active ? 'font-semibold text-foreground' : 'hover:bg-sidebar-accent/60',
                  )}
                >
                  {createElement(NAV_ICONS[tab.id] ?? NAV_ICON_FALLBACK, {
                    'aria-hidden': true,
                    className: cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground/80'),
                  })}
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  );
}
