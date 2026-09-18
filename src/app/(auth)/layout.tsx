import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className='min-h-svh w-full'>{children}</div>;
}
