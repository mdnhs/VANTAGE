'use client';

import { useRouter } from 'next/navigation';
import { HomepageCatalogForm } from '../homepage-catalog-form';
import { useCreateHomepageCatalog } from '../../hooks/api/mutation/use-create-homepage-catalog';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateHomepageCatalogForm() {
  const router = useRouter();
  const createHomepageCatalog = useCreateHomepageCatalog();

  return (
    <HomepageCatalogForm
      submitLabel='Create catalog item'
      isSubmitting={createHomepageCatalog.isPending}
      submitError={createHomepageCatalog.error?.message ?? null}
      onSubmit={async (input) => {
        await createHomepageCatalog.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.homepageCatalogs.index),
        });
      }}
    />
  );
}
