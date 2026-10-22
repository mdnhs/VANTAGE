import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { TwoFactorSetup } from '@/features/auth/components/two-factor-setup';
import { isAdminRole } from '@/lib/auth/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { requireActor } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Set up two-factor',
  robots: { index: false, follow: false, nocache: true },
};

const TITLE = 'Protect your account';

export default function TwoFactorSetupPage() {
  return (
    <div className='flex flex-col gap-8'>
      <Suspense
        fallback={
          <>
            <AuthHeader title={TITLE} />
            <AuthFormSkeleton />
          </>
        }
      >
        <Gate />
      </Suspense>
    </div>
  );
}

// The optional enrolment flow. Two-factor is optional for every role: nobody is sent here,
// and anyone can go back without finishing.
async function Gate() {
  const actor = await requireActor();
  if (actor.twoFactorEnabled) redirect(APP_ROUTES.dashboard.index);
  const recommended = isAdminRole(actor.roles);
  return (
    <>
      <AuthHeader
        title={TITLE}
        description={
          recommended
            ? 'Your role can change who has access, so two-factor authentication is strongly recommended: a code from your phone keeps your account safe even if your password leaks.'
            : 'Two-factor authentication is recommended: a code from your phone keeps your account safe even if your password leaks.'
        }
      />
      <TwoFactorSetup />
      <p className='text-sm text-muted-foreground'>
        Not a good time?{' '}
        <Link
          href={APP_ROUTES.dashboard.index}
          className='rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
        >
          Back to the dashboard
        </Link>
      </p>
    </>
  );
}
