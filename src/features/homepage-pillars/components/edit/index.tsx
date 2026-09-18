'use client';

import { useRouter } from 'next/navigation';
import { HomepagePillarForm } from '../homepage-pillar-form';
import { useUpdateHomepagePillar } from '../../hooks/api/mutation/use-update-homepage-pillar';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { HomepagePillar } from '../../types';

interface EditHomepagePillarFormProps {
  pillar: HomepagePillar;
}

export function EditHomepagePillarForm({ pillar }: EditHomepagePillarFormProps) {
  const router = useRouter();
  const updateHomepagePillar = useUpdateHomepagePillar(pillar.id);

  return (
    <HomepagePillarForm
      initialData={pillar}
      submitLabel='Save changes'
      isSubmitting={updateHomepagePillar.isPending}
      submitError={updateHomepagePillar.error?.message ?? null}
      onSubmit={async (input) => {
        await updateHomepagePillar.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.homepagePillars.index),
        });
      }}
    />
  );
}
