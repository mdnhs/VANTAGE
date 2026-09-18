'use client';

import { useRouter } from 'next/navigation';
import { ProjectForm } from '../project-form';
import { useUpdateProject } from '../../hooks/api/mutation/use-update-project';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { ProjectWithGallery } from '../../types';

interface EditProjectFormProps {
  project: ProjectWithGallery;
}

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const updateProject = useUpdateProject(project.id);

  return (
    <ProjectForm
      initialData={project}
      submitLabel='Save changes'
      isSubmitting={updateProject.isPending}
      submitError={updateProject.error?.message ?? null}
      onSubmit={async (input) => {
        await updateProject.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.projects.index),
        });
      }}
    />
  );
}
