'use client';

import { useRouter } from 'next/navigation';
import { MediaApiError } from '@/features/media/services/api';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { LegalPageForm } from '../legal-page-form';
import { useCreateLegalPage } from '../../hooks/api/mutation/use-create-legal-page';

export function CreateLegalPageForm() {
  const router = useRouter();
  const createPage = useCreateLegalPage();
  const error = createPage.error;

  return (
    <LegalPageForm
      submitLabel='Create page'
      isSubmitting={createPage.isPending}
      submitError={error?.message ?? null}
      submitCauses={error instanceof MediaApiError ? error.causes : undefined}
      onSubmit={(input) =>
        createPage
          .mutateAsync(input)
          .then(() => router.push(APP_ROUTES.content.legalPages.index))
          .catch(() => undefined)
      }
    />
  );
}
