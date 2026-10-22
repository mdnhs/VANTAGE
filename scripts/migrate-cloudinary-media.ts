// Cloudinary -> media library (R2 in production). Copies only; nothing is ever deleted.
//   yarn media:migrate --dry-run   list each ref (COPY|REUSE|MISSING|BLOCKED), write and upload nothing
//   yarn media:migrate             copy the missing files, then point content, settings and photos at them
//   yarn media:migrate --verify    exit 1 listing UNMIGRATED / UNREADABLE until everything has moved
import { fail } from './lib/cli-env';

async function main() {
  const flags = new Set(process.argv.slice(2));
  const { MigrationRefused, migrateCloudinaryMedia, verifyCloudinaryMigration } =
    await import('@/server/lib/media/cloudinary-migration');

  if (flags.has('--verify')) {
    const result = await verifyCloudinaryMigration();
    for (const problem of result.problems) console.error(problem);
    if (!result.ok) process.exit(1);
    console.log('OK every Cloudinary reference has moved to the media library');
    process.exit(0);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error('Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (or CLOUDINARY_CLOUD_NAME)');
  const dryRun = flags.has('--dry-run');
  let report;
  try {
    report = await migrateCloudinaryMedia({ dryRun, cloudName });
  } catch (error) {
    if (error instanceof MigrationRefused) {
      console.error(`FAIL ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
  for (const line of report.plan) console.log(`${line.action.padEnd(7)} ${line.source} ${line.legacySource}`);
  for (const problem of report.failed) console.error(`FAILED ${problem}`);
  console.log(
    `${dryRun ? 'DRY RUN' : 'DONE'}: ${report.refs} refs, ${report.copied} copied, ${report.reused} reused, ` +
      `${report.missing.length} missing, ${report.failed.length} failed; rewrote ${report.rewritten.columns} columns, ` +
      `${report.rewritten.settings.length} settings, ${report.rewritten.enquiryPhotos} enquiry photos`,
  );
  process.exit(report.failed.length > 0 ? 1 : 0);
}

main().catch(fail);
