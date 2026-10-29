'use client';

import { useRouter } from 'next/navigation';
import { MediaApiError } from '@/features/media/services/api';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { LegalPageForm } from '../legal-page-form';
import { useUpdateLegalPage } from '../../hooks/api/mutation/use-update-legal-page';
import type { LegalPage } from '../../types';

export function EditLegalPageForm({ page }: { page: LegalPage }) {
  const router = useRouter();
  const updatePage = useUpdateLegalPage(page.id);
  const error = updatePage.error;

  return (
    <LegalPageForm
      initialData={page}
      submitLabel='Save changes'
      isSubmitting={updatePage.isPending}
      submitError={error?.message ?? null}
      submitCauses={error instanceof MediaApiError ? error.causes : undefined}
      onSubmit={(input) =>
        updatePage
          .mutateAsync(input)
          .then(() => router.push(APP_ROUTES.content.legalPages.index))
          .catch(() => undefined)
      }
    />
  );
}
