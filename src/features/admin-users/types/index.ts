import type { AdminUser } from '@/server/db/schema';
import type { PermissionValue } from '@/lib/permission/permissions';
import type { ChangePasswordInput, CreateAdminUserInput, UpdateAdminUserInput } from '@/validations/admin-user-schema';

export type { CreateAdminUserInput, UpdateAdminUserInput, ChangePasswordInput };

// The API returns the row with its compressed `permissionsBitfield` decompressed into a
// plain `permissions` array — the shape every hook/component in this feature works with.
export type AdminUserWithPermissions = Omit<AdminUser, 'passwordHash' | 'permissionsBitfield'> & {
  permissions: PermissionValue[];
};
