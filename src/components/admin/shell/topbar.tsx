'use client';

import { MailIcon } from 'lucide-react';
import Link from 'next/link';

import { SearchPill } from '@/components/admin/command/search-pill';
import { buttonVariants } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useCan } from '@/contexts/actor-provider';
import { AiAssistant } from '@/features/ai/components/assistant';
import { cn } from '@/lib/utils';

import { ICON_BUTTON } from './constants';
import { NotificationsButton } from './notifications-button';
import { UserMenu } from './user-menu';

// The 72px topbar panel.
export function Topbar() {
  const canReadQuotes = useCan({ quote: ['read'] });
  const canReadContacts = useCan({ contact: ['read'] });
  const enquiriesHref = canReadQuotes ? '/dashboard/quotes' : canReadContacts ? '/dashboard/contacts' : null;
  return (
    <header className='flex h-[72px] shrink-0 items-center gap-2 rounded-card bg-sidebar px-3 sm:gap-3 sm:px-5'>
      <SidebarTrigger aria-label='Toggle navigation' className='size-10 rounded-full' />
      <div className='flex min-w-0 flex-1' data-slot='topbar-search'>
        <SearchPill />
      </div>
      <AiAssistant />
      {enquiriesHref ? (
        // A real link (role "link"), styled as an icon button.
        <Link
          href={enquiriesHref}
          aria-label='Enquiries'
          data-slot='button'
          className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), ICON_BUTTON)}
        >
          <MailIcon />
        </Link>
      ) : null}
      <NotificationsButton />
      <UserMenu />
    </header>
  );
}
