import { PERMISSIONS, type PermissionValue } from './permissions';

// Maps app routes (not file paths) to the permission values required to access them.
// An empty array means "any authenticated admin". Add entries here as dashboard pages
// are built in later phases — this file's shape should not otherwise change.
export const ROUTE_PERMISSIONS: Record<string, PermissionValue[]> = {
  '/dashboard': [],
  '/dashboard/services': [PERMISSIONS.SERVICES_MANAGE],
  '/dashboard/projects': [PERMISSIONS.PROJECTS_MANAGE],
  '/dashboard/testimonials': [PERMISSIONS.TESTIMONIALS_MANAGE],
  '/dashboard/partner-logos': [PERMISSIONS.LOGOS_MANAGE],
  '/dashboard/settings': [PERMISSIONS.SETTINGS_MANAGE],
  '/dashboard/admins': [PERMISSIONS.ADMINS_MANAGE],
};
