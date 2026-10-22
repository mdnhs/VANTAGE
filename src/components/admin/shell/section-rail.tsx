'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useActor } from '@/contexts/actor-provider';
import { activeSection, isActivePath } from '@/lib/admin/nav';
import { cn } from '@/lib/utils';

// A section's sub-pages (Website, Enquiries, SEO, Marketing) as vertical tabs
// inside the content panel, so the sidebar lists sections only. Below 1024px
// the tabs become a scrolling row above the page.
export function SectionRail({ children }: { children: React.ReactNode }) {
  const { roles } = useActor();
  const pathname = usePathname();
  const section = activeSection(pathname, roles);
  if (!section?.children) return children;

  // The deepest tab whose href covers the path wins.
  const current = section.children
    .filter((tab) => isActivePath(pathname, tab))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <div className='flex flex-col gap-6 [--rail-h:3.75rem] lg:flex-row lg:gap-8 lg:[--rail-h:0px]'>
      <nav aria-label={section.label} className='-mx-1 shrink-0 overflow-x-auto lg:mx-0 lg:w-52 lg:overflow-visible'>
        <p className='mb-2 hidden px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:block'>
          {section.label}
        </p>
        <ul className='flex gap-1 px-1 lg:flex-col lg:px-0'>
          {section.children.map((tab) => {
            const active = tab.id === current?.id;
            return (
              <li key={tab.id} className='relative shrink-0'>
                {active ? (
                  <span
                    aria-hidden
                    className='absolute top-1/2 left-0 hidden h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary lg:block'
                  />
                ) : null}
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center rounded-md px-3 text-sm whitespace-nowrap text-muted-foreground outline-none hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
                    active && 'bg-sidebar-accent font-semibold text-foreground',
                  )}
                >
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
