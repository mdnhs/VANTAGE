import { ExternalLinkIcon } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// The host to show; a malformed URL falls back to the raw string.
function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// The inspiration's "Download our Mobile App" slot, as "Your website".
// A neutral gradient card: the reference art is client-specific.
export function WebsiteCard({ siteUrl, children }: { siteUrl: string; children?: React.ReactNode }) {
  return (
    <div className='relative isolate overflow-hidden rounded-[18px] bg-promo p-5 group-data-[collapsible=icon]:hidden'>
      <p className='flex items-center gap-2 text-xs font-medium opacity-80'>
        <span aria-hidden className='size-2 rounded-full bg-chart-3' />
        Live
      </p>
      <p className='mt-3 text-lg leading-tight font-semibold'>Your website</p>
      <p className='mt-1 truncate text-xs opacity-75'>{hostOf(siteUrl)}</p>
      {/* A real link (role "link"), styled as a button. */}
      <a
        href={siteUrl}
        target='_blank'
        rel='noreferrer'
        data-slot='button'
        className={cn(buttonVariants(), 'mt-4 h-11 w-full rounded-xl font-semibold')}
      >
        Open site
        <ExternalLinkIcon data-icon='inline-end' />
        <span className='sr-only'> (opens in a new tab)</span>
      </a>
      {children ? <div className='mt-3'>{children}</div> : null}
    </div>
  );
}
