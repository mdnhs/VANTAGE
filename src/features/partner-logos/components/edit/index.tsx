'use client';

import { useRouter } from 'next/navigation';
import { PartnerLogoForm } from '../partner-logo-form';
import { useUpdatePartnerLogo } from '../../hooks/api/mutation/use-update-partner-logo';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { PartnerLogo } from '../../types';

interface EditPartnerLogoFormProps {
  partnerLogo: PartnerLogo;
}

export function EditPartnerLogoForm({ partnerLogo }: EditPartnerLogoFormProps) {
  const router = useRouter();
  const updatePartnerLogo = useUpdatePartnerLogo(partnerLogo.id);

  return (
    <PartnerLogoForm
      initialData={partnerLogo}
      submitLabel='Save changes'
      isSubmitting={updatePartnerLogo.isPending}
      submitError={updatePartnerLogo.error?.message ?? null}
      onSubmit={async (input) => {
        await updatePartnerLogo.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.partnerLogos.index),
        });
      }}
    />
  );
}
