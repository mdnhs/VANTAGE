import type { Metadata } from 'next';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { BackToSignIn } from '@/features/auth/components/back-to-sign-in';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
  robots: { index: false, follow: false, nocache: true },
};

export default function ForgotPasswordPage() {
  return (
    <div className='flex flex-col gap-8'>
      <AuthHeader
        title='Forgot your password?'
        description="Enter your email and we'll send you a link to choose a new one."
      />
      <ForgotPasswordForm />
      <BackToSignIn />
    </div>
  );
}
