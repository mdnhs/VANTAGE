/**
 * One-off script to insert the first admin user with every permission bit set.
 *
 * Usage:
 *   yarn tsx src/server/db/seed-admin.ts <email> <password> <name>
 *
 * Not wired into any build step — run manually, once, against the target database
 * (make sure DATABASE_URL / DATABASE_URL_UNPOOLED point at the right environment first).
 */
import bcrypt from 'bcryptjs';
import { adminUserRepository } from '@/server/repositories/admin-user-repository';
import { compressPermissions } from '@/lib/permission/utils';
import { PERMISSIONS } from '@/lib/permission/permissions';

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password || !name) {
    console.error('Usage: yarn tsx src/server/db/seed-admin.ts <email> <password> <name>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const existing = await adminUserRepository.byEmail(email);
  if (existing) {
    console.error(`An admin user with email "${email}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const permissionsBitfield = compressPermissions(Object.values(PERMISSIONS));

  const created = await adminUserRepository.create({
    email,
    passwordHash,
    name,
    role: 'admin',
    permissionsBitfield,
    isActive: true,
  });

  console.log(`Created admin user ${created.email} (${created.id}) with all permissions.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
