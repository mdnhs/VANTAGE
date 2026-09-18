'use client';

import { useRouter } from 'next/navigation';
import { AdminUserForm } from '../admin-user-form';
import { useCreateAdminUser } from '../../hooks/api/mutation/use-create-admin-user';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateAdminUserForm() {
  const router = useRouter();
  const createAdminUser = useCreateAdminUser();

  return (
    <AdminUserForm
      mode='create'
      submitLabel='Create admin'
      isSubmitting={createAdminUser.isPending}
      submitError={createAdminUser.error?.message ?? null}
      onSubmit={async (input) => {
        await createAdminUser.mutateAsync(
          { email: input.email, password: input.password, name: input.name, permissions: input.permissions },
          { onSuccess: () => router.push(APP_ROUTES.content.admins.index) },
        );
      }}
    />
  );
}
