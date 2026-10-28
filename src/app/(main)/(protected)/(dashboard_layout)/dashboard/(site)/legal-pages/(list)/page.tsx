import { LINK_PRIMARY, PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { hasPermission } from '@/lib/auth/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { legalPageService } from '@/server/services/legal-page-service';
import { LegalPageTable } from '@/features/legal-pages/components/list/legal-page-table';

export const metadata: Metadata = {
  title: 'Legal pages',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function LegalPagesListPage() {
  const actor = await requirePermission(permissionFor('/dashboard/legal-pages'));
  const { rows, total } = await legalPageService.listAdmin({ page: 1, limit: 50 });

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Legal pages'
        description='Privacy, terms and other policies. Published pages live at their own address and are linked from the footer in this order.'
        actions={
          hasPermission(actor.roles, { content: ['create'] }) ? (
            <Link href={APP_ROUTES.content.legalPages.create} className={LINK_PRIMARY}>
              Add legal page
            </Link>
          ) : undefined
        }
      />
      <LegalPageTable initialData={{ data: rows, total }} />
    </div>
  );
}
