'use client';

import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader, PRIMARY_ACTION } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActor, useCan } from '@/contexts/actor-provider';
import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { cn } from '@/lib/utils';
import { USER_STATUSES } from '@/validations/user-admin-schema';

import { useDeleteUser } from '../hooks/api/mutation/use-delete-user';
import { useResendInvite } from '../hooks/api/mutation/use-resend-invite';
import { useRevokeSessions } from '../hooks/api/mutation/use-revoke-sessions';
import { useUnbanUser } from '../hooks/api/mutation/use-unban-user';
import { useViewAs } from '../hooks/api/mutation/use-view-as';
import { useUserList } from '../hooks/api/query/use-user-list';
import type { UserAction, UserDto, UserStatusFilter } from '../types';
import { BanDialog } from './ban-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { InviteDialog } from './invite-dialog';
import { ManualLinkDialog, type ManualLink } from './manual-link-dialog';
import { PermissionMatrix } from './permission-matrix';
import { RoleDialog } from './role-dialog';
import { UsersTable } from './users-table';

const PAGE_SIZE = 25;
const ALL = '__all__';
const STATUS_LABELS: Record<UserStatusFilter, string> = {
  active: 'Active',
  banned: 'Banned',
  invited: 'Invite pending',
  'no-2fa': 'No two-factor',
};

type Open = { action: UserAction; user: UserDto } | null;

export function UsersView() {
  const actor = useActor();
  const canInvite = useCan({ user: ['create'] }) && !actor.impersonatedBy;
  const [tab, setTab] = useState<'people' | 'roles'>('people');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState<RoleName | null>(null);
  const [status, setStatus] = useState<UserStatusFilter | null>(null);
  const [page, setPage] = useState(1);
  const [inviting, setInviting] = useState(false);
  const [open, setOpen] = useState<Open>(null);
  // Failures stay inline (role=alert); successes are sonner toasts.
  const [notice, setNotice] = useState<{ tone: 'error'; text: string } | null>(null);
  const [manualLink, setManualLink] = useState<ManualLink | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const list = useUserList({
    page,
    pageSize: PAGE_SIZE,
    q: q || undefined,
    role: role ?? undefined,
    status: status ?? undefined,
  });

  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, q]);

  const total = list.data?.total;
  const lastPage = total === undefined ? undefined : Math.max(1, Math.ceil(total / PAGE_SIZE));

  const unban = useUnbanUser();
  const resend = useResendInvite();
  const revoke = useRevokeSessions();
  const remove = useDeleteUser();
  const viewAs = useViewAs();
  const confirmPending = revoke.isPending || remove.isPending;

  const done = (text: string) => {
    setNotice(null);
    toast.success(text);
  };
  const fail = (error: Error) => setNotice({ tone: 'error', text: error.message });

  function onAction(action: UserAction, user: UserDto) {
    setNotice(null);
    setActionError(null);
    if (action === 'unban') {
      unban.mutate(user.id, { onSuccess: () => done(`${user.name} can sign in again`), onError: fail });
    } else if (action === 'resend') {
      resend.mutate(user.id, {
        onSuccess: (result) => {
          if (result.manualLink) setManualLink({ email: user.email, link: result.manualLink });
          else done(`Invite sent to ${user.email}`);
        },
        onError: fail,
      });
    } else if (action === 'view-as') {
      viewAs.mutate(user.id, {
        // A full load, so no cached query outlives the identity switch.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full document load on purpose
        onSuccess: () => window.location.assign('/dashboard'),
        onError: fail,
      });
    } else {
      setOpen({ action, user });
    }
  }

  function confirm() {
    if (!open) return;
    const { action, user } = open;
    const mutation = action === 'delete' ? remove : revoke;
    mutation.mutate(user.id, {
      onSuccess: () => {
        done(action === 'delete' ? `${user.name} was deleted` : `${user.name} is signed out everywhere`);
        // Deleting the last person on a page leaves that page empty: step back.
        if (action === 'delete' && page > 1 && list.data?.items.length === 1) setPage(page - 1);
        setOpen(null);
      },
      onError: (error) => setActionError(error.message),
    });
  }

  const roleItems = [
    { value: ALL, label: 'All roles' },
    ...ROLE_NAMES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
  ];
  const statusItems = [
    { value: ALL, label: 'Any status' },
    ...USER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ];
  const target = open?.user;

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Users & roles'
        description='Who can sign in, and what each role is allowed to do.'
        actions={
          canInvite ? (
            <Button className={PRIMARY_ACTION} onClick={() => setInviting(true)}>
              <PlusIcon aria-hidden />
              Invite someone
            </Button>
          ) : null
        }
      />

      {notice ? (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive'
        >
          {notice.text}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as 'people' | 'roles')}>
        <TabsList>
          <TabsTrigger value='people'>People</TabsTrigger>
          <TabsTrigger value='roles'>Roles</TabsTrigger>
        </TabsList>
        <TabsContent value='people' className='flex flex-col gap-6 pt-4'>
          <div role='group' aria-label='Filters' className='flex flex-wrap items-center gap-3'>
            <Input
              type='search'
              aria-label='Search people'
              placeholder='Search name or email'
              className='w-full sm:w-72'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              items={roleItems}
              value={role ?? ALL}
              onValueChange={(value) => {
                setRole(value === ALL ? null : (value as RoleName));
                setPage(1);
              }}
            >
              <SelectTrigger aria-label='Filter by role' className='w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={statusItems}
              value={status ?? ALL}
              onValueChange={(value) => {
                setStatus(value === ALL ? null : (value as UserStatusFilter));
                setPage(1);
              }}
            >
              <SelectTrigger aria-label='Filter by status' className='w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {list.isPending ? (
            <p role='status' className='text-sm text-muted-foreground'>
              Loading people...
            </p>
          ) : list.isError ? (
            <div role='alert' className='flex flex-col items-start gap-3 rounded-lg border p-4'>
              <p className='text-sm text-destructive'>People didn&apos;t load: {list.error.message}</p>
              <Button variant='outline' onClick={() => list.refetch()}>
                Try again
              </Button>
            </div>
          ) : list.data.items.length === 0 ? (
            <div className='flex flex-col items-center gap-3 rounded-lg border p-6 text-center text-sm text-muted-foreground'>
              <p>Nobody matches these filters. Try a different search or clear the filters.</p>
              {page > 1 ? (
                <Button variant='outline' size='sm' onClick={() => setPage(1)}>
                  Back to the first page
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div aria-busy={list.isFetching || undefined} className={cn(list.isFetching && 'opacity-70')}>
                <UsersTable users={list.data.items} onAction={onAction} />
              </div>
              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>
                  Page {page} of {lastPage} ({list.data.total} people)
                </span>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={lastPage === undefined || page >= lastPage}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value='roles' className='pt-4'>
          <PermissionMatrix />
        </TabsContent>
      </Tabs>

      <InviteDialog
        open={inviting}
        onClose={() => setInviting(false)}
        onInvited={(email) => done(`Invite created for ${email}`)}
      />
      <ManualLinkDialog value={manualLink} onClose={() => setManualLink(null)} />
      <RoleDialog user={open?.action === 'roles' ? open.user : null} onClose={() => setOpen(null)} onDone={done} />
      <BanDialog user={open?.action === 'ban' ? open.user : null} onClose={() => setOpen(null)} onDone={done} />
      <ConfirmDialog
        open={open?.action === 'revoke' || open?.action === 'delete'}
        title={open?.action === 'delete' ? `Delete ${target?.name}?` : `Sign ${target?.name} out everywhere?`}
        description={
          open?.action === 'delete'
            ? `${target?.name} (${target?.email}) will lose access for good. Their past activity stays in the log. This can't be undone.`
            : `${target?.name} is signed out on every device and has to sign in again.`
        }
        confirmLabel={open?.action === 'delete' ? 'Delete' : 'Sign out'}
        pending={confirmPending}
        error={actionError}
        onClose={() => {
          setOpen(null);
          setActionError(null);
        }}
        onConfirm={confirm}
      />
    </div>
  );
}
