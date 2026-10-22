import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export function BackToSignIn() {
  return (
    <Link
      href={APP_ROUTES.auth.login}
      className='inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
    >
      <ArrowLeftIcon className='size-4' />
      Back to sign in
    </Link>
  );
}
