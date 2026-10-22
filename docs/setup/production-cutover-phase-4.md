# Production cutover: Phase 4 (site settings)

Moves the legacy `site_settings` row (90 columns) into versioned `settings` keys
(`site`, `contact`, `seo`, `page.home`, `page.services`, `page.our-work`, `page.insurance`,
`page.about`, `page.process`). The legacy table is only read, never changed or dropped.

## Order

1. Back up: `pg_dump "$DATABASE_URL" -Fc -f vantage-before-phase4.dump`.
2. Deploy the release. The public site is safe before the migration has run: a key that
   was never saved is read from the legacy row, so nothing changes visibly.
   Do not let anyone edit settings in the admin until the migration has run: run
   `yarn settings:migrate --dry-run` first. Until then the editor shows values repaired from the
   legacy row, and a first save would store them without the `LOSSY` gate the CLI enforces.
3. Plan: `yarn settings:migrate --dry-run`. It lists each key with its field count and prints
   any `LOSSY` lines (values that would be truncated or dropped).
4. Migrate: `yarn settings:migrate`. It writes the missing keys at version 1 (note
   "Migrated from site_settings", no user). It refuses, writing nothing, if anything is
   `LOSSY`: fix the value in the admin first, or accept it with `--allow-lossy`.
5. Verify: `yarn settings:migrate --verify`. Exits 1 and prints `MISMATCH` lines if the keys
   would render anything different from the legacy row.

Re-running is safe: existing keys are skipped. `--force` rewrites keys whose value changed
(as a new version); unchanged keys are left alone.

## Because of the legacy fallback, the order is safe

Deploying before migrating, migrating before deploying, or stopping half way all show the
same site. Once a key is saved (by the migration or an admin), the stored document wins.

The migration CLI runs outside Next and cannot expire the page cache. A key the site already
cached as "missing" keeps being served from the legacy row (same content, one extra database
read per request) until that key is saved in the admin or the app is redeployed. To switch over
at once, run the migration before the deploy, or restart the app after migrating.

## Known intentional differences

- A trust badge left blank on an existing row shows the default copy (it used to render blank).
- An invalid email in the legacy row becomes empty (the contact key stays valid).
- A Lottie logo over 2 MB is dropped (the normal logo is shown).

The email and Lottie cases appear as `LOSSY` in the dry run, so they are decided before anything is written.

Rollback: restore the dump, or delete the nine keys from `settings` (the public site then
reads the legacy row again).
