// Applies pending database migrations. Run by the deploy workflow before the image is built, so
// the schema is ready before the new code starts; a failure stops the deploy.
//   DATABASE_URL=... yarn tsx scripts/db-migrate.ts
// Takes a lock, so two runs at once queue instead of racing. Safe to run again: applied migrations are skipped.
import { runMigrations } from '../src/server/db/migrate';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

runMigrations(url).then(
  () => {
    console.log('[migrate] database is up to date');
    process.exit(0);
  },
  (error: unknown) => {
    // The class and message only: a failed query can echo parameters.
    console.error('[migrate] failed:', error instanceof Error ? error.message : 'unknown error');
    process.exit(1);
  },
);
