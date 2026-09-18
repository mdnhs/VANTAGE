import type { Metadata } from 'next';
import { AccountLoginForm } from '@/features/account/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false, nocache: true },
};

export default function AccountLoginPage() {
  return (
    <div className='flex min-h-screen w-full items-center justify-center bg-muted p-6'>
      <AccountLoginForm />
    </div>
  );
}
