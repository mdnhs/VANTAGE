import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { projectService } from '@/server/services/project-service';
import { EditProjectForm } from '@/features/projects/components/edit';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const project = await projectService.byId(id);
  if (!project) notFound();

  return (
    <PermissionGate permissions={[PERMISSIONS.PROJECTS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit project</h1>
          <p className='text-sm text-muted-foreground'>{project.title}</p>
        </div>
        <EditProjectForm project={project} />
      </div>
    </PermissionGate>
  );
}
