import type { PageTab } from '@/components/layout/page-tabs';
import { hasPermission } from '@/lib/auth/permissions';
import type { RoleName } from '@/lib/auth/permissions';
import type { PublicPageId } from '@/lib/seo/public-pages';

import { PageSeoTab } from './page-seo-tab';

// The SEO tab for a website page editor; empty for roles without seo.read (they get no tab).
export function seoTab(actor: { roles: readonly RoleName[] }, id: PublicPageId): PageTab[] {
  if (!hasPermission(actor.roles, { seo: ['read'] })) return [];
  return [{ value: 'seo', label: 'Search & sharing', content: <PageSeoTab id={id} /> }];
}
