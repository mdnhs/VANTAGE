import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { safeNext } from '@/lib/auth/safe-next';
import { hasPanelSession } from '../gate';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false, nocache: true },
};

const DONE_COPY: Record<string, string> = {
  invite: 'Password set. Sign in to get started.',
  reset: 'Password updated. Sign in with your new password.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className='flex flex-col gap-8'>
      <AuthHeader title='Welcome back' description='Sign in to manage the website.' />
      {/* Request-time data (session, search params) streams in under Cache Components. */}
      <Suspense fallback={<AuthFormSkeleton />}>
        <SignInGate searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// The proxy only sees cookies, so the real "already signed in" check is here: a valid
// session skips the form. A stale cookie fails it and gets the form, which is why this
// cannot loop with the panel's guard.
async function SignInGate({ searchParams }: { searchParams: SearchParams }) {
  const { next, done } = await searchParams;
  const target = safeNext(typeof next === 'string' ? next : null);
  if (await hasPanelSession()) redirect(target);
  const notice = typeof done === 'string' ? DONE_COPY[done] : undefined;
  return (
    <>
      {notice && (
        <p role='status' className='flex items-start gap-2 rounded-2xl bg-accent p-4 text-sm text-accent-foreground'>
          <CheckCircle2Icon className='mt-0.5 size-4 shrink-0 text-primary' />
          {notice}
        </p>
      )}
      <SignInForm next={target} />
    </>
  );
}
