import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { SectionTabs } from '@/components/layout/section-tabs';
import { OurWorkHeroForm } from '@/features/projects/components/our-work-hero-form';
import { projectService } from '@/server/services/project-service';
import { ProjectTable } from '@/features/projects/components/list/project-table';

export const metadata: Metadata = {
  title: 'Projects',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function ProjectsListPage() {
  await requirePermission(permissionFor('/dashboard/projects'));
  const [{ rows, total }, settings] = await Promise.all([
    projectService.listAdmin({ page: 1, limit: 50 }),
    siteSettingsService.getAdmin(),
  ]);

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Our work page</h1>
        <p className='text-sm text-muted-foreground'>
          Hero copy and the before/after projects shown on the Our Work page.
        </p>
      </div>
      <SectionTabs
        tabs={[
          { value: 'hero', label: 'Hero', content: <OurWorkHeroForm settings={settings ?? null} /> },
          {
            value: 'projects',
            label: 'Projects',
            content: (
              <>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-muted-foreground'>Displayed in this order on the Our Work page.</p>
                  <Link href={APP_ROUTES.content.projects.create} className={cn(buttonVariants())}>
                    Add project
                  </Link>
                </div>
                <ProjectTable initialData={{ data: rows, total }} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
