// Legacy site_settings -> versioned settings keys (site, contact, seo, page.*).
//   yarn settings:migrate --dry-run   plan only: keys and field counts, nothing written
//   yarn settings:migrate             write the missing keys at version 1; safe to repeat
//   yarn settings:migrate --force     overwrite keys that already exist (saves a new version)
//   yarn settings:migrate --allow-lossy  accept values that must be truncated or dropped (otherwise refused)
//   yarn settings:migrate --verify    compare what the public site renders; exits 1 on mismatch
import { fail } from './lib/cli-env';

async function main() {
  const flags = new Set(process.argv.slice(2));
  const { LossyMigrationError, migrateSiteSettings, verifySiteSettingsMigration } =
    await import('@/server/lib/settings/site-settings-migration');

  if (flags.has('--verify')) {
    const result = await verifySiteSettingsMigration();
    if (!result.ok) {
      for (const problem of result.problems) console.error(`MISMATCH ${problem}`);
      process.exit(1);
    }
    console.log(`OK verified ${result.checked} rendered values`);
    process.exit(0);
  }

  const dryRun = flags.has('--dry-run');
  let result;
  try {
    result = await migrateSiteSettings({ dryRun, force: flags.has('--force'), allowLossy: flags.has('--allow-lossy') });
  } catch (error) {
    if (error instanceof LossyMigrationError) {
      for (const l of error.lossy) console.error(`LOSSY ${l}`);
      console.error(`FAIL ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
  if (!result.legacyRow) {
    console.log('No site_settings row; nothing to migrate (the public site uses the built-in defaults).');
    process.exit(0);
  }
  for (const row of result.plan) {
    console.log(
      `${row.action.padEnd(9)} ${row.key.padEnd(15)} ${String(row.fields).padStart(2)} fields -> v${row.version}`,
    );
  }
  for (const w of result.warnings) console.warn(`WARN ${w}`);
  for (const l of result.lossy) console.warn(`LOSSY ${l}`);
  console.log(
    `${dryRun ? 'DRY RUN: would write' : 'wrote'} ${result.plan.filter((p) => p.action === 'create' || p.action === 'overwrite').length}, skipped ${result.skipped}`,
  );
  process.exit(0);
}

main().catch(fail);
