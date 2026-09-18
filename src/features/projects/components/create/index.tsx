'use client';

import { useRouter } from 'next/navigation';
import { ProjectForm } from '../project-form';
import { useCreateProject } from '../../hooks/api/mutation/use-create-project';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function CreateProjectForm() {
  const router = useRouter();
  const createProject = useCreateProject();

  return (
    <ProjectForm
      submitLabel='Create project'
      isSubmitting={createProject.isPending}
      submitError={createProject.error?.message ?? null}
      onSubmit={async (input) => {
        await createProject.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.projects.index),
        });
      }}
    />
  );
}
