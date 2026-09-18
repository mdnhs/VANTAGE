import { PERMISSIONS, type PermissionValue } from './permissions';

// Maps app routes (not file paths) to the permission values required to access them.
// An empty array means "any authenticated admin". Add entries here as dashboard pages
// are built in later phases — this file's shape should not otherwise change.
export const ROUTE_PERMISSIONS: Record<string, PermissionValue[]> = {
  '/dashboard': [],
  '/content/services': [PERMISSIONS.SERVICES_MANAGE],
  '/content/projects': [PERMISSIONS.PROJECTS_MANAGE],
  '/content/testimonials': [PERMISSIONS.TESTIMONIALS_MANAGE],
  '/content/logos': [PERMISSIONS.LOGOS_MANAGE],
  '/content/settings': [PERMISSIONS.SETTINGS_MANAGE],
  '/content/admins': [PERMISSIONS.ADMINS_MANAGE],
};
