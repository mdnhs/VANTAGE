'use client';

import { EyeIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useActor } from '@/contexts/actor-provider';
import { authClient } from '@/lib/auth-client';

// Sticky banner while an owner/admin is viewing as someone else. Fixed and
// centred at the bottom so it never fights the sidebar or the header.
export function ViewAsBanner() {
  const { user, roles, impersonatedBy } = useActor();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!impersonatedBy) return null;

  async function stop() {
    setBusy(true);
    setFailed(false);
    const { error } = await authClient.admin.stopImpersonating();
    if (error) {
      setBusy(false);
      setFailed(true);
      return;
    }
    // A full load drops every cached query from the viewed identity.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full document load on purpose
    window.location.assign('/dashboard/users');
  }

  return (
    <div
      role='status'
      className='fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border bg-foreground px-4 py-2 text-sm text-background shadow-lg'
    >
      <EyeIcon aria-hidden className='size-4 shrink-0' />
      <span className='truncate'>
        {failed ? "Couldn't stop viewing. Sign out to end it." : `Viewing as ${user.name} (${roles.join(', ')})`}
      </span>
      <Button size='sm' variant='secondary' disabled={busy} onClick={stop}>
        Stop viewing
      </Button>
    </div>
  );
}
