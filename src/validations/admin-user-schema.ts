import { z } from 'zod';
import { PERMISSIONS, type PermissionValue } from '@/lib/permission/permissions';

// z.enum needs a non-empty tuple of string literals — Object.values(PERMISSIONS) is exactly
// that at the type level since PERMISSIONS is a `const` object.
const permissionValues = Object.values(PERMISSIONS) as [PermissionValue, ...PermissionValue[]];

export const createAdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255),
  permissions: z.array(z.enum(permissionValues)).min(1),
});

// No email change and no password change here by design — email is the login identifier
// (changing it is a separate, higher-risk flow) and password resets go through the
// dedicated `changePasswordSchema` / `/admins/:id/password` route below.
export const updateAdminUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  permissions: z.array(z.enum(permissionValues)).min(1).optional(),
  isActive: z.boolean().optional(),
});

// Admin-resets-another-admin's-password (or their own) action — deliberately simple, no
// current-password confirmation since the caller already holds ADMINS_MANAGE.
export const changePasswordSchema = z.object({
  password: z.string().min(8),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
