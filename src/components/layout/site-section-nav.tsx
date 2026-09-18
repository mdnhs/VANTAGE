'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SiteSectionNavProps {
  items: { label: string; description: string; href: string; matchPrefixes: string[] }[];
}

export function SiteSectionNav({ items }: SiteSectionNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label='Website pages' className='flex flex-col gap-1'>
      <p className='px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase'>Website pages</p>
      {items.map((item) => {
        const active = item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            title={item.description}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
