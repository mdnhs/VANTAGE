'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Shown when SMTP is not configured: the set-password link comes back in the
// response so the owner can pass it on by hand. It is never stored or logged.
export function ManualLinkNotice({ email, link }: { email: string; link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm text-muted-foreground'>
        Email isn&apos;t set up, so nothing was sent. Share this link with {email} so they can choose a password. It
        works once and expires.
      </p>
      <div className='flex gap-2'>
        <Input readOnly aria-label='Set-password link' value={link} onFocus={(event) => event.currentTarget.select()} />
        <Button type='button' variant='outline' onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
    </div>
  );
}
