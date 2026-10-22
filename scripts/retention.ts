// Enquiry retention (privacy settings): permanently deletes old quotes and contact messages.
//   yarn jobs:retention --dry-run   print what would be deleted; nothing is changed
//   yarn jobs:retention             delete (one transaction) and write an audit row with counts only
import { fail } from './lib/cli-env';

async function main() {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const { runRetention } = await import('@/server/services/retention-service');
  const r = await runRetention({ dryRun });
  console.log(
    `${dryRun ? 'DRY RUN: would delete' : 'deleted'} ` +
      `quotes: ${r.quotes.expired} past ${r.windows.enquiryRetentionMonths} months + ${r.quotes.spam} spam past ${r.windows.spamRetentionDays} days; ` +
      `contacts: ${r.contacts.expired} + ${r.contacts.spam}; photos: ${r.photos}`,
  );
  process.exit(0);
}

main().catch(fail);
