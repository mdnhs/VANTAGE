import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateHomepageProcessStepForm } from '@/features/homepage-process-steps/components/create';

export const metadata: Metadata = {
  title: 'Add process step',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreateHomepageProcessStepPage() {
  await requirePermission(permissionFor('/dashboard/homepage-process-steps/create'));
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Add process step' description='Add a new homepage process-step card.' />
      <CreateHomepageProcessStepForm />
    </div>
  );
}
