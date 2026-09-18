'use client';

import { useRouter } from 'next/navigation';
import { PartnerLogoForm } from '../partner-logo-form';
import { useCreatePartnerLogo } from '../../hooks/api/mutation/use-create-partner-logo';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreatePartnerLogoForm() {
  const router = useRouter();
  const createPartnerLogo = useCreatePartnerLogo();

  return (
    <PartnerLogoForm
      submitLabel='Create partner logo'
      isSubmitting={createPartnerLogo.isPending}
      submitError={createPartnerLogo.error?.message ?? null}
      onSubmit={async (input) => {
        await createPartnerLogo.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.partnerLogos.index),
        });
      }}
    />
  );
}
