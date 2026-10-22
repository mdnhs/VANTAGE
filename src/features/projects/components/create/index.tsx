'use client';

import { MediaApiError } from '@/features/media/services/api';

import { useRouter } from 'next/navigation';
import { ProjectForm } from '../project-form';
import { useCreateProject } from '../../hooks/api/mutation/use-create-project';
import type { ProjectCreatePayload } from '../../types';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateProjectForm() {
  const router = useRouter();
  const createProject = useCreateProject();

  return (
    <ProjectForm
      submitLabel='Create project'
      isSubmitting={createProject.isPending}
      submitError={createProject.error?.message ?? null}
      submitCauses={createProject.error instanceof MediaApiError ? createProject.error.causes : undefined}
      onSubmit={async (input) => {
        const { beforeImageMediaId, afterImageMediaId } = input;
        // The form refuses to submit without both images; this keeps the types honest.
        if (!beforeImageMediaId || !afterImageMediaId) throw new Error('Choose a before and an after image');
        await createProject.mutateAsync(
          { ...input, beforeImageMediaId, afterImageMediaId } satisfies ProjectCreatePayload,
          {
            onSuccess: () => router.push(APP_ROUTES.content.projects.index),
          },
        );
      }}
    />
  );
}
