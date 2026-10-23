'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useActor } from '@/contexts/actor-provider';
import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { ROLE_LABELS, ROLE_PURPOSE } from '@/lib/auth/role-labels';

import { useSetRoles } from '../hooks/api/mutation/use-set-roles';
import type { UserDto } from '../types';

export function RoleDialog({
  user,
  onClose,
  onDone,
}: {
  user: UserDto | null;
  onClose(): void;
  onDone(message: string): void;
}) {
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        {user ? <RoleForm key={user.id} user={user} onClose={onClose} onDone={onDone} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RoleForm({ user, onClose, onDone }: { user: UserDto; onClose(): void; onDone(message: string): void }) {
  const actor = useActor();
  const [chosen, setChosen] = useState<RoleName[]>(user.roles);
  const [error, setError] = useState<string | null>(null);
  const isOwner = actor.roles.includes('owner');
  const save = useSetRoles();

  const toggle = (role: RoleName, on: boolean) =>
    setChosen((current) => (on ? [...current, role] : current.filter((r) => r !== role)));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Roles for {user.name}</DialogTitle>
        <DialogDescription>Choose one or more. They get everything any chosen role allows.</DialogDescription>
      </DialogHeader>
      <fieldset className='flex flex-col gap-3'>
        <legend className='sr-only'>Roles</legend>
        {ROLE_NAMES.map((role) => {
          const locked = role === 'owner' && !isOwner;
          return (
            <div key={role} className='flex items-start gap-3'>
              <Checkbox
                id={`role-${role}`}
                checked={chosen.includes(role)}
                disabled={locked}
                onCheckedChange={(on) => toggle(role, on === true)}
                className='mt-1'
              />
              <Label htmlFor={`role-${role}`} className='flex flex-col items-start gap-0.5'>
                <span className='font-semibold'>{ROLE_LABELS[role]}</span>
                <span className='text-sm font-normal text-muted-foreground'>
                  {ROLE_PURPOSE[role]}
                  {locked ? ' Only an owner can grant this.' : ''}
                </span>
              </Label>
            </div>
          );
        })}
      </fieldset>
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <Button variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={save.isPending || chosen.length === 0}
          onClick={() => {
            setError(null);
            save.mutate(
              { id: user.id, roles: chosen },
              {
                onSuccess: () => {
                  onDone(`Roles updated for ${user.name}`);
                  onClose();
                },
                onError: (e) => setError(e.message),
              },
            );
          }}
        >
          Save roles
        </Button>
      </DialogFooter>
    </>
  );
}
