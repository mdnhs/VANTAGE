import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { BackToSignIn } from '@/features/auth/components/back-to-sign-in';
import { TwoFactorForm } from '@/features/auth/components/two-factor-form';
import { safeNext } from '@/lib/auth/safe-next';
import { hasPanelSession } from '../gate';

export const metadata: Metadata = {
  title: 'Two-factor',
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Second sign-in step: no session yet, only Better Auth's short-lived two-factor challenge cookie.
export default function TwoFactorPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className='flex flex-col gap-8'>
      <AuthHeader title='Check your authenticator' description='Enter the code from your app to finish signing in.' />
      <Suspense fallback={<AuthFormSkeleton />}>
        <Gate searchParams={searchParams} />
      </Suspense>
      <BackToSignIn />
    </div>
  );
}

// `next` is sanitised here, before the form or this page can redirect to it.
async function Gate({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const target = safeNext(typeof next === 'string' ? next : null);
  if (await hasPanelSession()) redirect(target);
  return <TwoFactorForm next={target} />;
}
