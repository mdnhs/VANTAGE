'use client';

import { useRouter } from 'next/navigation';
import { HomepageCatalogForm } from '../homepage-catalog-form';
import { useUpdateHomepageCatalog } from '../../hooks/api/mutation/use-update-homepage-catalog';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { HomepageCatalog } from '../../types';

interface EditHomepageCatalogFormProps {
  catalog: HomepageCatalog;
}

export function EditHomepageCatalogForm({ catalog }: EditHomepageCatalogFormProps) {
  const router = useRouter();
  const updateHomepageCatalog = useUpdateHomepageCatalog(catalog.id);

  return (
    <HomepageCatalogForm
      initialData={catalog}
      submitLabel='Save changes'
      isSubmitting={updateHomepageCatalog.isPending}
      submitError={updateHomepageCatalog.error?.message ?? null}
      onSubmit={async (input) => {
        await updateHomepageCatalog.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.homepageCatalogs.index),
        });
      }}
    />
  );
}
