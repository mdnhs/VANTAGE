'use client';

import { Camera, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatRelativeTime,
  formatServiceType,
  getAvatarColor,
  getInitials,
} from '@/features/quote-requests/components/inbox/quote-inbox-formatters';
import { ContactStatusBadge } from '../contact-status-badge';
import type { ContactMessage } from '../../types';

interface ContactInboxItemProps {
  message: ContactMessage;
  isSelected: boolean;
  onSelect: () => void;
}

export function ContactInboxItem({ message, isSelected, onSelect }: ContactInboxItemProps) {
  const isNew = message.status === 'new';
  const fullName = `${message.firstName} ${message.lastName}`.trim();
  const photoCount = message.photoUrls?.length ?? 0;

  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-start gap-3 border-b border-border/60 p-3.5 text-left transition-all duration-150',
        isSelected
          ? 'bg-accent/80 text-foreground dark:bg-muted/70'
          : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
      )}
    >
      {isSelected && <span className='absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-red-600' />}

      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tracking-tight shadow-2xs transition-transform group-hover:scale-105',
          getAvatarColor(fullName),
        )}
      >
        {getInitials(fullName)}
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-1.5'>
            {isNew && (
              <span className='size-2 shrink-0 rounded-full bg-red-600 ring-2 ring-red-600/20' title='New message' />
            )}
            <span
              className={cn(
                'truncate text-xs',
                isNew || isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground/90',
              )}
            >
              {fullName}
            </span>
          </div>

          <span className='shrink-0 font-mono text-[11px] text-muted-foreground/80'>
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>

        <div className='flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-foreground/80'>
          <Wrench className='size-3 shrink-0 text-muted-foreground' />
          <span className='truncate'>{formatServiceType(message.service)}</span>
        </div>

        <p className='line-clamp-1 text-[11px] leading-normal text-muted-foreground'>{message.message}</p>

        <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
          <ContactStatusBadge status={message.status} />

          {photoCount > 0 && (
            <span className='inline-flex items-center gap-1 rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
              <Camera className='size-2.5' />
              <span>{photoCount}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
