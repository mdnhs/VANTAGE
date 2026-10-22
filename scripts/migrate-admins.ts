// Legacy admin_users -> Better Auth users/accounts.
//   yarn auth:migrate-admins --dry-run   plan only (email -> role, never hashes)
//   yarn auth:migrate-admins             run, in one transaction; safe to repeat
//   yarn auth:migrate-admins --verify    check the result; exits 1 on any mismatch
import { fail } from './lib/cli-env';

async function main() {
  const flags = new Set(process.argv.slice(2));
  const { migrateAdmins, verifyAdminMigration } = await import('@/server/lib/auth/admin-migration');

  if (flags.has('--verify')) {
    const result = await verifyAdminMigration();
    if (!result.ok) {
      for (const problem of result.problems) console.error(`MISMATCH ${problem}`);
      process.exit(1);
    }
    console.log(`OK verified ${result.checked} admin(s)`);
    process.exit(0);
  }

  const dryRun = flags.has('--dry-run');
  const result = await migrateAdmins({ dryRun });
  for (const row of result.plan) {
    console.log(`${row.action.padEnd(6)} ${row.email} -> ${row.role}${row.banned ? ' (banned)' : ''}`);
  }
  console.log(
    `${dryRun ? 'DRY RUN: would create' : 'created'} ${result.created}, skipped ${result.skipped}, ` +
      `${dryRun ? 'quote assignments to copy' : 'quote assignments copied'} ${result.quotesLinked}`,
  );
  process.exit(0);
}

main().catch(fail);
