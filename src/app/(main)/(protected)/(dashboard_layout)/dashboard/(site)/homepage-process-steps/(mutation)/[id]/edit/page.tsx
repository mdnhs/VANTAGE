import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { EditHomepageProcessStepForm } from '@/features/homepage-process-steps/components/edit';

export const metadata: Metadata = {
  title: 'Edit process step',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate/getSession) per request — must not be
// prerendered.
export const instant = false;

interface EditHomepageProcessStepPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditHomepageProcessStepPage({ params }: EditHomepageProcessStepPageProps) {
  const { id } = await params;
  const step = await homepageProcessStepService.byId(id);
  if (!step) notFound();

  return (
    <PermissionGate permissions={[PERMISSIONS.PROCESS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit process step</h1>
          <p className='text-sm text-muted-foreground'>{step.title}</p>
        </div>
        <EditHomepageProcessStepForm step={step} />
      </div>
    </PermissionGate>
  );
}
