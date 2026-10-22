import type { ReactNode } from 'react';

// Shared wrapper for every screen that edits a public website page (home, services, our work,
// insurance, about, process). The page menu is the global section rail in the admin shell;
// this route group only keeps the URLs at `/dashboard/<page>`.
export default function SiteContentLayout({ children }: { children: ReactNode }) {
  return <div className='min-w-0'>{children}</div>;
}
