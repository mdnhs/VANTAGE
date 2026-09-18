// Project-specific permission keys, `module.resource.action` dot notation.
// Used both by `requirePermission(...)` on Hono routes and by the client-side
// permission gates/hooks below. Keep this the single source of truth.
export const PERMISSIONS = {
  SERVICES_MANAGE: 'content.services.manage',
  PROJECTS_MANAGE: 'content.projects.manage',
  TESTIMONIALS_MANAGE: 'content.testimonials.manage',
  LOGOS_MANAGE: 'content.logos.manage',
  PILLARS_MANAGE: 'content.pillars.manage',
  CATALOG_MANAGE: 'content.catalog.manage',
  PROCESS_MANAGE: 'content.process.manage',
  SETTINGS_MANAGE: 'content.settings.manage',
  ADMINS_MANAGE: 'user_management.admin.manage',
  USERS_MANAGE: 'user_management.user.manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
