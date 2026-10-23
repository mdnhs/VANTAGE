'use client';

import { MoreHorizontalIcon, ShieldCheckIcon } from 'lucide-react';

import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { StatusPill } from '@/components/admin/dashboard/status-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActor } from '@/contexts/actor-provider';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

import type { UserAction, UserDto } from '../types';
import { availableActions, userStatus } from '../utils/present';

const LABELS: Record<UserAction, string> = {
  roles: 'Change roles',
  resend: 'Resend invite',
  'view-as': 'View as this person',
  ban: 'Ban',
  unban: 'Unban',
  revoke: 'Sign out everywhere',
  delete: 'Delete',
};
const DESTRUCTIVE = new Set<UserAction>(['ban', 'revoke', 'delete']);

const WHEN = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Dublin',
});

// One list for every width: a row wraps into a card on narrow screens.
export function UsersTable({
  users,
  onAction,
}: {
  users: UserDto[];
  onAction(action: UserAction, user: UserDto): void;
}) {
  const actor = useActor();

  if (users.length === 0) {
    return <EmptyState title='No people found' description='Nobody matches these filters or has been invited yet.' />;
  }

  return (
    <ul role='list' aria-label='People' className='flex flex-col gap-3'>
      {users.map((user) => {
        const status = userStatus(user);
        const actions = availableActions(actor, user);
        const isYou = user.id === actor.user.id;
        return (
          <li key={user.id} className='flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-card p-4'>
            <div className='flex min-w-0 flex-1 basis-56 flex-col'>
              <span className='truncate font-semibold'>
                {user.name}
                {isYou ? <span className='font-normal text-muted-foreground'> (you)</span> : null}
              </span>
              <span className='truncate text-sm text-muted-foreground'>{user.email}</span>
            </div>
            <div className='flex flex-wrap items-center gap-1.5'>
              {user.roles.map((role) => (
                <Badge key={role} variant='secondary'>
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
            </div>
            <div className='flex flex-wrap items-center gap-3 text-sm'>
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
              <span className='flex items-center gap-1 text-muted-foreground'>
                <ShieldCheckIcon aria-hidden className='size-4' />
                {user.twoFactorEnabled ? '2FA on' : '2FA off'}
              </span>
              <span className='text-xs text-muted-foreground'>
                {user.lastActiveAt ? `Active ${WHEN.format(new Date(user.lastActiveAt))}` : 'Never active'}
              </span>
            </div>
            <div className='ml-auto flex size-9 items-center justify-center'>
              {actions.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant='ghost' size='icon' aria-label={`Actions for ${user.name}`} />}
                  >
                    <MoreHorizontalIcon aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-56'>
                    {actions.map((action) => (
                      <div key={action}>
                        {action === 'ban' || action === 'unban' ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuItem
                          variant={DESTRUCTIVE.has(action) ? 'destructive' : 'default'}
                          onClick={() => onAction(action, user)}
                        >
                          {LABELS[action]}
                        </DropdownMenuItem>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
