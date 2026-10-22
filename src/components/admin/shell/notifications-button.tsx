'use client';

import { BellIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ICON_BUTTON } from './constants';

// The bell. A later phase fills it from the notifications feed; until then it
// is honestly empty.
export function NotificationsButton() {
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant='outline' size='icon-lg' className={ICON_BUTTON} aria-label='Notifications' />}
      >
        <BellIcon />
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 gap-0 p-0'>
        <PopoverHeader className='border-b px-4 py-3'>
          <PopoverTitle>Notifications</PopoverTitle>
        </PopoverHeader>
        <ScrollArea className='max-h-80'>
          <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
            You&apos;re all caught up. New enquiries and failed deliveries will show here.
          </p>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
