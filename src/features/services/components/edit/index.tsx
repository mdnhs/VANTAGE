'use client';

import { useRouter } from 'next/navigation';
import { ServiceForm } from '../service-form';
import { useUpdateService } from '../../hooks/api/mutation/use-update-service';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { Service } from '../../types';

interface EditServiceFormProps {
  service: Service;
}

export function EditServiceForm({ service }: EditServiceFormProps) {
  const router = useRouter();
  const updateService = useUpdateService(service.id);

  return (
    <ServiceForm
      initialData={service}
      submitLabel='Save changes'
      isSubmitting={updateService.isPending}
      submitError={updateService.error?.message ?? null}
      onSubmit={async (input) => {
        await updateService.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.services.index),
        });
      }}
    />
  );
}
