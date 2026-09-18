import type { ReactNode } from 'react';
import { getSession } from '@/lib/permission/server-utils';
import { createPermissionChecker } from '@/lib/permission/utils';
import { SITE_NAV_ITEMS } from '@/components/layout/site-nav-items';
import { SiteSectionNav } from '@/components/layout/site-section-nav';

// Shared shell for every screen that edits a public website page (home, services, our work,
// insurance, about, process) — left-hand page menu on the left, the page's own editor on the
// right. Route group, so URLs stay `/dashboard/<page>`.
export default async function SiteContentLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const checker = session ? createPermissionChecker(session.permissions) : null;
  const items = SITE_NAV_ITEMS.filter((item) => checker?.hasAnyPermissionByValues(item.permissions));

  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
      <aside className='shrink-0 lg:sticky lg:top-6 lg:w-48'>
        <SiteSectionNav items={items} />
      </aside>
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  );
}
