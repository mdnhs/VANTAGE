'use client';

import { AuthorReadOnlyNotice, useAuthorOnly } from '@/components/admin/author-gate';
import { MediaApiError } from '@/features/media/services/api';

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
  const authorOnly = useAuthorOnly();
  const updatePartnerLogo = useUpdatePartnerLogo(partnerLogo.id);

  if (authorOnly) return <AuthorReadOnlyNotice backHref={APP_ROUTES.content.partnerLogos.index} />;

  return (
    <PartnerLogoForm
      initialData={partnerLogo}
      submitLabel='Save changes'
      isSubmitting={updatePartnerLogo.isPending}
      submitError={updatePartnerLogo.error?.message ?? null}
      submitCauses={updatePartnerLogo.error instanceof MediaApiError ? updatePartnerLogo.error.causes : undefined}
      onSubmit={async (input) => {
        await updatePartnerLogo.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.partnerLogos.index),
        });
      }}
    />
  );
}
