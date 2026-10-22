import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
import { projectService } from '@/server/services/project-service';
import { EditProjectForm } from '@/features/projects/components/edit';

export const metadata: Metadata = {
  title: 'Edit project',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  await requirePermission(permissionFor('/dashboard/projects/[id]/edit'));
  const { id } = await params;
  const project = await projectService.byId(id);
  if (!project) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Edit project' description={project.title} />
      <EditProjectForm project={project} />
    </div>
  );
}
