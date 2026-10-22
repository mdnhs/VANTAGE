'use client';

import { useMutation } from '@tanstack/react-query';
import { SendIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCan } from '@/contexts/actor-provider';
import { GLOBAL_ACCESS } from '@/lib/content/global-access';

import { sendNotificationsTestEmail, type TestEmailResult } from '../services/api';

export const testEmailMessage = (result: TestEmailResult): string => {
  if (result.status === 'not_configured') return 'SMTP not configured';
  if (result.status === 'sent') return `Test email sent to ${result.to}`;
  return `Test email failed: ${result.error}`;
};

// Sits under the Notifications form: verifies the SMTP connection and mails the signed-in person.
export function NotificationsTestEmail() {
  const canSend = useCan(GLOBAL_ACCESS.notifications.update);
  const test = useMutation({ mutationFn: sendNotificationsTestEmail });
  if (!canSend) return null;

  const ok = test.data?.status === 'sent';
  return (
    <section aria-label='Test email' className='flex flex-col items-start gap-3'>
      <p className='text-sm text-muted-foreground'>
        Checks the mail server connection and sends a test message to your own address.
      </p>
      <Button variant='outline' disabled={test.isPending} onClick={() => test.mutate()}>
        <SendIcon data-icon='inline-start' />
        {test.isPending ? 'Sending…' : 'Send test email'}
      </Button>
      {test.data || test.error ? (
        <p role='status' className={ok ? 'text-sm' : 'text-sm text-destructive'}>
          {test.data ? testEmailMessage(test.data) : `Test email failed: ${test.error?.message ?? 'Request failed'}`}
        </p>
      ) : null}
    </section>
  );
}
