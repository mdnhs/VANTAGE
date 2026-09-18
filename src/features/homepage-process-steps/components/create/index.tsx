'use client';

import { useRouter } from 'next/navigation';
import { HomepageProcessStepForm } from '../homepage-process-step-form';
import { useCreateHomepageProcessStep } from '../../hooks/api/mutation/use-create-homepage-process-step';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateHomepageProcessStepForm() {
  const router = useRouter();
  const createHomepageProcessStep = useCreateHomepageProcessStep();

  return (
    <HomepageProcessStepForm
      submitLabel='Create process step'
      isSubmitting={createHomepageProcessStep.isPending}
      submitError={createHomepageProcessStep.error?.message ?? null}
      onSubmit={async (input) => {
        await createHomepageProcessStep.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.homepageProcessSteps.index),
        });
      }}
    />
  );
}
