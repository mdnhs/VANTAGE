'use client';

import { useRouter } from 'next/navigation';
import { HomepagePillarForm } from '../homepage-pillar-form';
import { useCreateHomepagePillar } from '../../hooks/api/mutation/use-create-homepage-pillar';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateHomepagePillarForm() {
  const router = useRouter();
  const createHomepagePillar = useCreateHomepagePillar();

  return (
    <HomepagePillarForm
      submitLabel='Create homepage pillar'
      isSubmitting={createHomepagePillar.isPending}
      submitError={createHomepagePillar.error?.message ?? null}
      onSubmit={async (input) => {
        await createHomepagePillar.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.homepagePillars.index),
        });
      }}
    />
  );
}
