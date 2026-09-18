import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreateHomepageProcessStepForm } from '@/features/homepage-process-steps/components/create';

export const metadata: Metadata = {
  title: 'Add process step',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate/getSession) per request — must not be
// prerendered.
export const instant = false;

export default function CreateHomepageProcessStepPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.PROCESS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add process step</h1>
          <p className='text-sm text-muted-foreground'>Add a new homepage process-step card.</p>
        </div>
        <CreateHomepageProcessStepForm />
      </div>
    </PermissionGate>
  );
}
