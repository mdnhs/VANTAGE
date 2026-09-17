import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-[#0a0c10] font-sans text-slate-200 antialiased selection:bg-red-600 selection:text-white'>
      {children}
    </div>
  );
}
