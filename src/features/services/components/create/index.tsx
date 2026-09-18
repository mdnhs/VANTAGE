'use client';

import { useRouter } from 'next/navigation';
import { ServiceForm } from '../service-form';
import { useCreateService } from '../../hooks/api/mutation/use-create-service';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateServiceForm() {
  const router = useRouter();
  const createService = useCreateService();

  return (
    <ServiceForm
      submitLabel='Create service'
      isSubmitting={createService.isPending}
      submitError={createService.error?.message ?? null}
      onSubmit={async (input) => {
        await createService.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.services.index),
        });
      }}
    />
  );
}
