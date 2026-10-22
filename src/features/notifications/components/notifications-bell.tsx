'use client';

import { useState } from 'react';

import { BellIcon } from 'lucide-react';
import Link from 'next/link';

import { relativeTime } from '@/components/admin/dashboard/format';
import { ICON_BUTTON } from '@/components/admin/shell/constants';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { badgeText } from '@/lib/notifications';
import { cn } from '@/lib/utils';

import { useMarkNotificationsSeen, useNotifications } from '../hooks/use-notifications';

export function NotificationsBell({ className }: { className?: string }) {
  const { data, dataUpdatedAt } = useNotifications();
  const seen = useMarkNotificationsSeen();
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const onOpenChange = (open: boolean) => {
    if (!open || !data) return;
    // Remember what was unread on open so those rows keep their dot while the badge clears.
    setFresh(new Set(data.items.filter((i) => i.unread).map((i) => i.id)));
    if (data.unread > 0) seen.mutate();
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            size='icon-lg'
            className={cn(ICON_BUTTON, 'relative', className)}
            aria-label={unread > 0 ? `Notifications (${badgeText(unread)} unread)` : 'Notifications'}
          />
        }
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden
            className='absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-medium text-primary-foreground'
          >
            {badgeText(unread)}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 gap-0 p-0'>
        <PopoverHeader className='border-b px-4 py-3'>
          <PopoverTitle>Notifications</PopoverTitle>
        </PopoverHeader>
        <ScrollArea className='max-h-80'>
          {items.length === 0 ? (
            <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
              You&apos;re all caught up. New enquiries and failed deliveries will show here.
            </p>
          ) : (
            <ul className='divide-y'>
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className='flex gap-3 px-4 py-3 text-sm hover:bg-muted'>
                    <span className='mt-1.5 size-2 shrink-0'>
                      {fresh.has(item.id) && (
                        <>
                          <span aria-hidden className='block size-2 rounded-full bg-primary' />
                          <span className='sr-only'>(new)</span>
                        </>
                      )}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block font-medium'>{item.title}</span>
                      <span className='block truncate text-muted-foreground'>{item.description}</span>
                      <time dateTime={item.at} className='text-xs text-muted-foreground'>
                        {relativeTime(item.at, dataUpdatedAt)}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
