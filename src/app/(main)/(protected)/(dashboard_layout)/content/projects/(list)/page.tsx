import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { projectService } from '@/server/services/project-service';
import { ProjectTable } from '@/features/projects/components/list/project-table';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function ProjectsListPage() {
  const { rows, total } = await projectService.listAdmin({ page: 1, limit: 50 });

  return (
    <PermissionGate permissions={[PERMISSIONS.PROJECTS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-semibold'>Projects</h1>
            <p className='text-sm text-muted-foreground'>
              Before/after restorations shown on the Our Work page, in display order.
            </p>
          </div>
          <Link href={APP_ROUTES.content.projects.create} className={cn(buttonVariants())}>
            Add project
          </Link>
        </div>
        <ProjectTable initialData={{ data: rows, total }} />
      </div>
    </PermissionGate>
  );
}
