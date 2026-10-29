'use client';

import { ShieldAlert, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActor, useCan } from '@/contexts/actor-provider';
import { useUpdateContactMessage } from '@/features/contact-messages/hooks/api/mutation/use-update-contact-message';
import { useUpdateQuoteRequest } from '@/features/quote-requests/hooks/api/mutation/use-update-quote-request';
import type { SpamReason } from '@/lib/enquiries/spam';

interface SpamActionsProps {
  kind: 'quote' | 'contact';
  id: string;
  status: string;
  spamReason?: SpamReason | string | null;
  hasBilling?: boolean;
  className?: string;
}

export function SpamActions({ kind, id, status, className }: SpamActionsProps) {
  const actor = useActor();
  const canUpdate = useCan(kind === 'quote' ? { quote: ['update'] } : { contact: ['update'] });
  const isViewingAs = Boolean(actor.impersonatedBy);

  const quoteUpdate = useUpdateQuoteRequest(id);
  const contactUpdate = useUpdateContactMessage(id);

  if (!canUpdate || isViewingAs) {
    return null;
  }

  const isSpam = status === 'spam';
  const isPending = kind === 'quote' ? quoteUpdate.isPending : contactUpdate.isPending;

  const handleMarkSpam = () => {
    if (kind === 'quote') {
      quoteUpdate.mutate({ status: 'spam' as never });
    } else {
      contactUpdate.mutate({ status: 'spam' as never });
    }
  };

  const handleNotSpam = () => {
    if (kind === 'quote') {
      quoteUpdate.mutate({ status: 'new' as never });
    } else {
      contactUpdate.mutate({ status: 'new' as never });
    }
  };

  if (isSpam) {
    return (
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={isPending}
        onClick={handleNotSpam}
        className={cn('h-8 gap-1.5 text-xs', className)}
      >
        <ShieldCheck className='size-3.5 text-emerald-600' />
        Not spam
      </Button>
    );
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      disabled={isPending}
      onClick={handleMarkSpam}
      className={cn(
        'h-8 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive',
        className,
      )}
    >
      <ShieldAlert className='size-3.5' />
      Mark as spam
    </Button>
  );
}
