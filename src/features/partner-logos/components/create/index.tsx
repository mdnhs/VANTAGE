'use client';

import { MediaApiError } from '@/features/media/services/api';

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
      submitCauses={createPartnerLogo.error instanceof MediaApiError ? createPartnerLogo.error.causes : undefined}
      onSubmit={async (input) => {
        const { logoMediaId } = input;
        // The form refuses to submit without a logo; this keeps the types honest.
        if (!logoMediaId) throw new Error('Choose a logo');
        await createPartnerLogo.mutateAsync({ ...input, logoMediaId } satisfies CreatePartnerLogoInput, {
          onSuccess: () => router.push(APP_ROUTES.content.partnerLogos.index),
        });
      }}
    />
  );
}
