'use client';

import { useRouter } from 'next/navigation';
import { HomepageProcessStepForm } from '../homepage-process-step-form';
import { useUpdateHomepageProcessStep } from '../../hooks/api/mutation/use-update-homepage-process-step';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { HomepageProcessStep } from '../../types';

interface EditHomepageProcessStepFormProps {
  step: HomepageProcessStep;
}

export function EditHomepageProcessStepForm({ step }: EditHomepageProcessStepFormProps) {
  const router = useRouter();
  const updateHomepageProcessStep = useUpdateHomepageProcessStep(step.id);

  return (
    <HomepageProcessStepForm
      initialData={step}
      submitLabel='Save changes'
      isSubmitting={updateHomepageProcessStep.isPending}
      submitError={updateHomepageProcessStep.error?.message ?? null}
      onSubmit={async (input) => {
        await updateHomepageProcessStep.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.homepageProcessSteps.index),
        });
      }}
    />
  );
}
