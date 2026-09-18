import bcrypt from 'bcryptjs';
import { adminUserRepository } from '@/server/repositories/admin-user-repository';
import { ApiError } from '@/server/lib/errors';
import { compressPermissions, decompressPermissions } from '@/lib/permission/utils';
import type { CreateAdminUserInput, UpdateAdminUserInput } from '@/validations/admin-user-schema';

// No caching anywhere in this module — admin_users is security-sensitive and rarely read,
// so always hitting the database is the correct trade-off (there is no cost win to chase
// on a table this small and this cold).

// Strips the password hash and expands the compressed bitfield into a plain permissions
// array — never let `passwordHash` leave this module toward the API layer.
function toPublicAdminUser<T extends { permissionsBitfield: string; passwordHash: string }>(row: T) {
  const { passwordHash: _passwordHash, permissionsBitfield, ...rest } = row;
  return { ...rest, permissions: decompressPermissions(permissionsBitfield) };
}

export const adminUserService = {
  async list() {
    const rows = await adminUserRepository.list();
    return rows.map(toPublicAdminUser);
  },

  async byId(id: string) {
    const row = await adminUserRepository.byId(id);
    return row ? toPublicAdminUser(row) : null;
  },

  async create(data: CreateAdminUserInput) {
    const existing = await adminUserRepository.byEmail(data.email);
    if (existing) throw ApiError.conflict('An admin user with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const permissionsBitfield = compressPermissions(data.permissions);

    const row = await adminUserRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: 'admin',
      permissionsBitfield,
      isActive: true,
    });
    return toPublicAdminUser(row);
  },

  // `currentUserId` is the authenticated caller (from the session), `targetId` the row being
  // changed — self-service (editing your own permissions/active state through this screen)
  // is deliberately blocked; that should happen through a separate profile flow, not this one.
  async update(currentUserId: string, targetId: string, data: UpdateAdminUserInput) {
    if (currentUserId === targetId) {
      throw ApiError.forbidden('You cannot modify your own account through this screen');
    }

    const target = await adminUserRepository.byId(targetId);
    if (!target) throw ApiError.notFound('Admin user not found');

    // Deactivating the last remaining active admin would lock everyone out.
    if (data.isActive === false && target.isActive) {
      const activeCount = await adminUserRepository.countActive();
      if (activeCount <= 1) throw ApiError.conflict('At least one active admin must remain');
    }

    const patch: Partial<{ name: string; permissionsBitfield: string; isActive: boolean }> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.permissions !== undefined) patch.permissionsBitfield = compressPermissions(data.permissions);
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    const row = await adminUserRepository.update(targetId, patch);
    if (!row) throw ApiError.notFound('Admin user not found');
    return toPublicAdminUser(row);
  },

  async resetPassword(targetId: string, newPassword: string) {
    const target = await adminUserRepository.byId(targetId);
    if (!target) throw ApiError.notFound('Admin user not found');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await adminUserRepository.updatePassword(targetId, passwordHash);
  },

  // Destructive action exposed in the UI is deactivate/reactivate (via `update`'s
  // `isActive` flag), not hard delete — safer default for a security-sensitive table with
  // no draft/soft-delete concept otherwise. `remove` still exists for completeness/scripts
  // but is not wired to any route in this pass.
  async remove(currentUserId: string, targetId: string) {
    if (currentUserId === targetId) throw ApiError.forbidden('You cannot delete your own account');

    const target = await adminUserRepository.byId(targetId);
    if (!target) throw ApiError.notFound('Admin user not found');

    if (target.isActive) {
      const activeCount = await adminUserRepository.countActive();
      if (activeCount <= 1) throw ApiError.conflict('At least one active admin must remain');
    }

    await adminUserRepository.remove(targetId);
  },
};
