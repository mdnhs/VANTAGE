'use client';

import { AuthorReadOnlyNotice, useAuthorOnly } from '@/components/admin/author-gate';
import { useActor } from '@/contexts/actor-provider';
import { MediaApiError } from '@/features/media/services/api';

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
  const authorOnly = useAuthorOnly();
  const userId = useActor().user.id;
  const updateProject = useUpdateProject(project.id);

  if (authorOnly && !(project.createdBy === userId && project.status === 'draft'))
    return <AuthorReadOnlyNotice backHref={APP_ROUTES.content.projects.index} />;

  return (
    <ProjectForm
      initialData={project}
      submitLabel='Save changes'
      isSubmitting={updateProject.isPending}
      submitError={updateProject.error?.message ?? null}
      submitCauses={updateProject.error instanceof MediaApiError ? updateProject.error.causes : undefined}
      onSubmit={async (input) => {
        await updateProject.mutateAsync(input, {
          onSuccess: () => router.push(APP_ROUTES.content.projects.index),
        });
      }}
    />
  );
}
