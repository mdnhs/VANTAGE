import { PERMISSIONS, type PermissionValue } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';

export interface SiteNavItem {
  label: string;
  description: string;
  href: string;
  // Extra path prefixes that keep this item highlighted (e.g. the create/edit screens of
  // records that are listed under this page).
  matchPrefixes: string[];
  permissions: PermissionValue[];
}

// Left-hand navigation for every screen that edits a public website page. One sidebar entry
// ("Website pages") opens this section instead of one sidebar entry per public page.
export const SITE_NAV_ITEMS: SiteNavItem[] = [
  {
    label: 'Home page',
    description: 'Hero, pillars, catalog, process, testimonials, logos',
    href: APP_ROUTES.content.homePage.index,
    matchPrefixes: [
      '/dashboard/home-page',
      '/dashboard/homepage-',
      '/dashboard/testimonials',
      '/dashboard/partner-logos',
    ],
    permissions: [
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.PILLARS_MANAGE,
      PERMISSIONS.CATALOG_MANAGE,
      PERMISSIONS.PROCESS_MANAGE,
      PERMISSIONS.TESTIMONIALS_MANAGE,
      PERMISSIONS.LOGOS_MANAGE,
    ],
  },
  {
    label: 'Services',
    description: 'Services page hero and service blocks',
    href: APP_ROUTES.content.services.index,
    matchPrefixes: ['/dashboard/services'],
    permissions: [PERMISSIONS.SERVICES_MANAGE],
  },
  {
    label: 'Our work',
    description: 'Our Work page hero and projects',
    href: APP_ROUTES.content.projects.index,
    matchPrefixes: ['/dashboard/projects'],
    permissions: [PERMISSIONS.PROJECTS_MANAGE],
  },
  {
    label: 'Insurance',
    description: 'Insurance page copy, cards and steps',
    href: APP_ROUTES.content.insurance.index,
    matchPrefixes: ['/dashboard/insurance'],
    permissions: [PERMISSIONS.SETTINGS_MANAGE],
  },
  {
    label: 'About',
    description: 'About page hero, heritage, team, standards',
    href: APP_ROUTES.content.about.index,
    matchPrefixes: ['/dashboard/about'],
    permissions: [PERMISSIONS.SETTINGS_MANAGE],
  },
  {
    label: 'Process',
    description: 'Process page header copy',
    href: APP_ROUTES.content.processPage.index,
    matchPrefixes: ['/dashboard/process-page'],
    permissions: [PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.PROCESS_MANAGE],
  },
];
