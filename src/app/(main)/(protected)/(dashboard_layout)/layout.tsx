import type { ReactNode } from 'react';

// TODO: add sidebar/header once components/layout is scaffolded for a feature.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className='flex min-h-screen flex-col'>{children}</div>;
}
