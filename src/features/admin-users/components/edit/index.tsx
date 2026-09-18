'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminUserForm } from '../admin-user-form';
import { useUpdateAdminUser } from '../../hooks/api/mutation/use-update-admin-user';
import { useResetAdminPassword } from '../../hooks/api/mutation/use-reset-admin-password';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { AdminUserWithPermissions } from '../../types';

interface EditAdminUserFormProps {
  adminUser: AdminUserWithPermissions;
  currentUserId: string;
}

// Small inline "Reset password" card instead of a modal — no Dialog component exists in
// this project's ui kit yet, and a full modal would be scope creep for a single field.
function ResetPasswordCard({ id }: { id: string }) {
  const [password, setPassword] = useState('');
  const resetPassword = useResetAdminPassword(id);

  const handleReset = async () => {
    await resetPassword.mutateAsync({ password });
    setPassword('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-3 sm:max-w-sm'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='reset-password'>New password</Label>
          <Input
            id='reset-password'
            type='password'
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {resetPassword.error && <p className='text-sm text-destructive'>{resetPassword.error.message}</p>}
        {resetPassword.isSuccess && <p className='text-sm text-muted-foreground'>Password updated.</p>}
        <Button
          type='button'
          variant='outline'
          disabled={password.length < 8 || resetPassword.isPending}
          onClick={handleReset}
        >
          {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Edit form has no password field — resetting a password is the separate action above,
// using the dedicated reset-password mutation/route.
export function EditAdminUserForm({ adminUser, currentUserId }: EditAdminUserFormProps) {
  const router = useRouter();
  const updateAdminUser = useUpdateAdminUser(adminUser.id);
  const isSelf = adminUser.id === currentUserId;

  return (
    <div className='flex flex-col gap-6'>
      {isSelf ? (
        <p className='text-sm text-muted-foreground'>You cannot edit your own account through this screen.</p>
      ) : (
        <>
          <AdminUserForm
            mode='edit'
            initialData={adminUser}
            submitLabel='Save changes'
            isSubmitting={updateAdminUser.isPending}
            submitError={updateAdminUser.error?.message ?? null}
            onSubmit={async (input) => {
              await updateAdminUser.mutateAsync(
                { name: input.name, permissions: input.permissions, isActive: input.isActive },
                { onSuccess: () => router.push(APP_ROUTES.content.admins.index) },
              );
            }}
          />
          <ResetPasswordCard id={adminUser.id} />
        </>
      )}
    </div>
  );
}
