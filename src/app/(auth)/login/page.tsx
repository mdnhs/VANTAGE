import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false, nocache: true },
};

export default function LoginPage() {
  return (
    <div className='flex w-full flex-col items-center gap-6 bg-muted p-6 md:p-10'>
      <div className='w-full max-w-sm md:max-w-4xl'>
        <LoginForm />
      </div>
    </div>
  );
}
