# Phase 11 production cutover (parity pass and legacy removal)

The owner runs this; agents never run it against production. Phase 11 ships in two stages. Stage A is the
normal deploy. Stage B drops the legacy columns and tables, and happens only on the owner's go.

## 1. What Phase 11 changes

- **Spam handling.** The enquiry forms carry a hidden field and a signed form stamp. A submission that trips
  either check is stored with status `spam` and a reason, sends no email and no ad-platform event, and stores
  no photos. The visitor sees exactly the normal confirmation. "Not spam" moves a record back to `new` and
  sends nothing late. A quote with invoice or payment data cannot be marked as spam.
- **Dashboard visibility.** Everyone with dashboard access sees the cards their permissions allow. The
  pipeline block (revenue, chart, channels, recent leads with names) renders only for people who can read
  quotes.
- **Export and privacy.** CSV export for quotes and contact messages (rate limited, audited), and a privacy
  request tool: export a person's records as JSON, or erase them by email. Erase keeps quotes that carry
  billing data and reports them.
- **Author rule.** An author creates and edits only their own draft projects. They cannot publish, feature or
  reorder, and existing projects are read-only for them.
- **Share cards.** Each of the eight public pages has its own generated share image at `/og/<page>`. `/og`
  stays as the site-wide card.
- **Purge job.** Replaced and deleted library files are queued and removed from storage 30 days later by
  `yarn jobs:retention`.
- **Migration 0028.** Adds the columns the above needs. Run it from a repo checkout of the deployed commit,
  never inside the container: `yarn db:deploy`.

## 2. Stage A gate (legacy read paths removed)

Stage A removes every app read of the Cloudinary ids, the Cloudinary URL fallback, `res.cloudinary.com`
and the old `site_settings` fallback. If the data was not migrated first, images and settings vanish from
the public site. So a build containing Stage A may take traffic only after the check below prints `OK`.

Deploy order:

1. **Back up first.** `pg_dump "$DATABASE_URL" -Fc -f vantage-before-phase11.dump`
2. **Migrate the database.** `yarn db:deploy` (migration 0028). It only adds nullable columns, one index
   per new column and one empty table, so the old build keeps working against it.
3. **Migrate the legacy data**, in this order, each with its `--verify` where it has one. Run them while the
   old build (the tag below) is still serving, then re-run to confirm they are quiet. Any non-zero exit from a
   `--verify` run blocks the deploy: fix what it reports first. `yarn legacy:check` counts what is left but does
   not re-check that copied files are readable, which is what `media:migrate --verify` does.
   1. `yarn auth:migrate-admins`, then `yarn auth:migrate-admins --verify`
   2. `yarn settings:migrate`, then `yarn settings:migrate --verify`
   3. `yarn media:migrate`, then `yarn media:migrate --verify`
4. **Check.** Run `yarn legacy:check` against the production `DATABASE_URL`. It is read-only: it never writes
   and never prints secrets or photo URLs, only counts. Each unmigrated class prints its count and the
   command that fixes it:

   ```
   services.icon                              0
   ...
   admin accounts not migrated                1  -> yarn auth:migrate-admins
   FAIL legacy data remains; run the commands above, then re-run yarn legacy:check
   ```

   It exits `1` while any count is above zero, and prints `OK` and exits `0` only when every count is `0`.
   Fix what it names, re-run, repeat.

5. **Only on `OK`:** build and deploy the Stage A image (`docker compose up -d --build`).

**Until the check prints `OK`, deploy the tag `p11-pre-legacy-removal`.** It is the last build that still
has the fallbacks, so it serves the site correctly with unmigrated data. Falling back later is the same
move: redeploy that tag. Stage A changes no data, so rolling the image back needs no restore.

## 3. Stage B (drop the legacy columns and tables)

Completed by Task 21.

## 4. Design notes

- **Eyebrow contrast.** The 12px eyebrow labels keep brand colour on `#131313` (3.85:1). That is the Figma
  colour and the default rule, so the pixels match the design, but it is below 4.5:1 for small text. The
  estimator error text and other body-size text were moved to a colour that passes. Say so if you want the
  eyebrows lightened too; it is a one-token change.
