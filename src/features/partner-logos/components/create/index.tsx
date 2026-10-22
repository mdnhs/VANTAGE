'use client';

import { useRouter } from 'next/navigation';
import { PartnerLogoForm } from '../partner-logo-form';
import { useCreatePartnerLogo } from '../../hooks/api/mutation/use-create-partner-logo';
import type { CreatePartnerLogoInput } from '../../types';
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
        // The form refuses to submit a new logo without one.
        await createPartnerLogo.mutateAsync(input as CreatePartnerLogoInput, {
          onSuccess: () => router.push(APP_ROUTES.content.partnerLogos.index),
        });
      }}
    />
  );
}
