import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { legalPageService } from '@/server/services/legal-page-service';
import { EditLegalPageForm } from '@/features/legal-pages/components/edit';

export const metadata: Metadata = {
  title: 'Edit legal page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

interface EditLegalPagePageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditLegalPagePage({ params }: EditLegalPagePageProps) {
  await requirePermission(permissionFor('/dashboard/legal-pages/[id]/edit'));
  const { id } = await params;
  const page = await legalPageService.byId(id);
  if (!page) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Edit legal page' description={page.title} />
      <EditLegalPageForm page={page} />
    </div>
  );
}
