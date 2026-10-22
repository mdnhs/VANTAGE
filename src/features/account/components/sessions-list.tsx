'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MonitorSmartphoneIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { accountKeys } from '../lib/query-keys';
import { AccountApiError, fetchDevices, revokeDevice, revokeOtherDevices } from '../services/api';

function relativeTime(iso: string, now: number) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

// Users list and revoke their own sessions. The server sends a device summary
// per session, never its token or IP address.
export function SessionsList() {
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: accountKeys.sessions, queryFn: fetchDevices });
  const refresh = () => queryClient.invalidateQueries({ queryKey: accountKeys.sessions });
  const revoke = useMutation({
    mutationFn: revokeDevice,
    onSuccess: () => {
      toast.success('Signed out of that device');
      return refresh();
    },
    onError: (error) => {
      // Signed out elsewhere or expired: the list was stale, nothing failed.
      if (error instanceof AccountApiError && error.code === 'NOT_FOUND') {
        toast.info('That device was already signed out');
      } else {
        toast.error(error.message);
      }
      return refresh();
    },
  });
  const revokeOthers = useMutation({
    mutationFn: revokeOtherDevices,
    onSuccess: () => {
      toast.success('Signed out of your other devices');
      return refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  if (sessions.isPending) return <Skeleton className='h-40 w-full' />;
  if (sessions.isError) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {sessions.error.message}
      </p>
    );
  }

  const now = sessions.dataUpdatedAt;
  const list = sessions.data;
  const busy = revoke.isPending || revokeOthers.isPending;
  return (
    <div className='flex flex-col gap-4'>
      <ul aria-label='Signed-in devices' className='flex flex-col divide-y'>
        {list.map((session) => (
          <li key={session.id} className='flex flex-wrap items-center gap-3 py-3'>
            <MonitorSmartphoneIcon aria-hidden className='size-5 text-muted-foreground' />
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='font-semibold'>{session.device}</span>
              <span className='text-xs text-muted-foreground'>
                Last active {relativeTime(session.lastActiveAt, now)}
              </span>
            </div>
            {/* Signing this device out is the user menu's "Log out". */}
            {session.current ? (
              <Badge variant='secondary'>This device</Badge>
            ) : (
              <Button variant='outline' disabled={busy} onClick={() => revoke.mutate(session.id)}>
                Sign out
                <span className='sr-only'> {session.device}</span>
              </Button>
            )}
          </li>
        ))}
      </ul>
      {list.length > 1 ? (
        <div>
          <Button variant='outline' disabled={busy} onClick={() => revokeOthers.mutate()}>
            Sign out other devices
          </Button>
        </div>
      ) : null}
    </div>
  );
}
