# Phase 5 production cutover (media migration)

The owner runs this; agents never run it against production. Copying is safe to repeat and
never deletes anything. The deploy alone changes nothing visible: until the migration runs, the
site keeps rendering the legacy Cloudinary URLs.

## Before you start

- **Where the CLIs run.** `yarn media:migrate`, `yarn media:cloudinary-cleanup`, `yarn media:smoke`,
  `yarn settings:migrate` and `yarn db:deploy` use `tsx`, `drizzle-kit` and `scripts/`. They are not
  in the standalone runner image (`node server.js` only). Run them from a repo checkout of the
  deployed commit with `yarn install` done and the production environment loaded
  (`DATABASE_URL` plus the media variables below), never inside the running container.
- **R2 setup.**
  1. Create the bucket.
  2. Give it public read access: attach a custom domain (recommended) or enable the r2.dev URL.
     That https origin is `MEDIA_PUBLIC_URL` (https is required).
  3. Create an R2 API token with Object Read & Write scoped to that bucket only.
  4. Set `MEDIA_DRIVER=s3`, `S3_ACCOUNT_ID` (or `S3_ENDPOINT`), `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
     `S3_SECRET_ACCESS_KEY` and `MEDIA_PUBLIC_URL` in the production environment.
  5. Go/no-go check: `yarn media:smoke` (with that environment) uploads a 1x1 test image to the
     bucket and reads it back from `MEDIA_PUBLIC_URL`. Do not continue until it passes.
- **`MEDIA_PUBLIC_URL` is also a build argument.** `next.config.ts` reads it at build time to allow the
  R2 host for `next/image`. Without it every R2 image fails with a 400 ("hostname not configured").
  Pass `--build-arg MEDIA_PUBLIC_URL=https://media.example.com` (docker-compose passes it from the
  environment) and rebuild; setting it only at runtime is not enough.
- **Reverse proxy body size.** nginx `client_max_body_size` must be `111m` (see the Phase 2 runbook): the
  public forms accept bodies up to 110 MB and admin uploads 101 MB. With the older `101m` a large
  enquiry is cut off by nginx with a 413 before the app sees it.

## Steps

1. **Back up first.** `pg_dump "$DATABASE_URL" -Fc -f vantage-before-phase5.dump`
2. **Rehearse steps 3-6 on a fresh copy of production** (restore the dump into a scratch database and
   point `DATABASE_URL` at it) before touching the real one.
3. **Check the production environment:** `MEDIA_DRIVER=s3`, the S3 variables, `MEDIA_PUBLIC_URL`,
   and keep `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set (it powers the fallback until Phase 11).
   The migration reads the originals from Cloudinary, so the cloud name must be correct.
4. **Deploy, then migrate the database.** Nothing runs migrations on start (the image runs
   `node server.js`). From the repo checkout run `yarn db:deploy` (migration 0024 adds `media.scope`
   and the `*_media_id` columns) **before** switching traffic to the new build, or the new code
   queries columns that do not exist yet. Nothing is converted yet.
5. **Migrate:**
   1. `yarn settings:migrate --verify` must pass first (the media migration refuses with
      "Run yarn settings:migrate first" if a public settings key is missing).
   2. `yarn media:migrate --dry-run`: one line per reference, `COPY | REUSE | MISSING | BLOCKED`.
      Review every `MISSING` (Cloudinary no longer has the file; its reference stays as it is) and
      every `BLOCKED` (that file was deleted in the library on purpose, so it is never relinked).
      To resolve a `BLOCKED` reference, open the place that still uses it and either pick a new
      image from the library or remove the image, then re-run. A project gallery with a `MISSING`
      image keeps that legacy row and so stays read-only in the admin until the file is restored in
      Cloudinary or the row is dealt with.
   3. `yarn media:migrate`: copies each file into the media library (R2), then points the
      service/catalog/logo/project/testimonial images, project galleries, the settings documents
      (new version, note "Media moved to R2") and the legacy enquiry photo URLs (as enquiry
      photos) at the copies. The old Cloudinary ids stay in place.
6. **Verify:** `yarn media:migrate --verify` prints `OK` and exits 0. Any `UNMIGRATED <where>` or
   `UNREADABLE <mediaId>` line is a problem: fix or re-run step 5 (idempotent, safe any time).
   Then **redeploy (rebuild) the app**: the CLI runs outside Next and cannot expire the page cache,
   and statically built pages live on disk, so a plain restart does not re-render them. Pages the
   site already built keep showing the old Cloudinary URLs (same images) until a rebuild, or until
   each document or content row is saved in the admin.
   **Check before any cleanup:** view-source on `/` and `/about` (and the other public pages) must
   contain no `res.cloudinary.com`. `yarn settings:migrate --verify` keeps passing after this step.
7. **Weeks later, optional:** only after the view-source check in step 6 is clean, keep Cloudinary and the dump until you are fully confident.
   `yarn media:cloudinary-cleanup` is a dry run: counts per folder under `vantage/` (images and
   videos) and, per folder, how many unreferenced files would be kept.
   **Take a fresh `pg_dump` immediately before deleting**, then `yarn media:cloudinary-cleanup --delete`.
   It refuses unless `yarn media:migrate --verify` passes, deletes **only files that have a live copy in
   the media library**, and logs every batch of 100. Files nothing migrated (anything else under `vantage/`)
   are kept and reported as "N unreferenced kept"; deleting those too needs the explicit
   `--include-unreferenced` flag. It needs `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
   `CLOUDINARY_API_SECRET` in the environment. Rate limits and server errors are retried twice; if a
   run stops part-way it prints how many were deleted, and it is safe to run again.
   Deleted Cloudinary assets cannot be restored.

## Behaviour to know

- Project galleries that still have old-storage images are read-only in the admin ("It can be edited
  after the media migration runs"); step 5 moves them to the library and unlocks editing.
- Enquiry photos already copied show once in the admin: the old `photo_urls` entry stays in the
  database but is hidden while its copy exists.
- Public forms refuse HEIC and GIF photos with a message naming the allowed types (JPG, PNG, WebP,
  AVIF). Safari and most phones convert HEIC before upload.
- The `local` driver serves `/uploads` with byte ranges and streams from disk; production should
  still use `s3`.
- Files Cloudinary cannot serve as a supported type (HEIC, GIF, SVG) are fetched once as a PNG.
- About-page team photos and testimonial avatars get an automatic focal point (attention
  detection) so the portrait crop stays on the face; adjust it in the Media library if needed.
- A re-run reuses files by their `legacy_source` (`cloudinary:image|video:<publicId>`); it never
  uploads the same asset twice.

## Rollback

- Restoring `vantage-before-phase5.dump` is only safe **before** `yarn media:cloudinary-cleanup --delete`.
  After the cleanup deleted the Cloudinary originals there is no rollback: the dump would point at files
  that no longer exist.
- A restore discards everything made since the backup: admin edits, uploads, and enquiries (quotes and
  contact messages) that arrived in the meantime.
- Keep Cloudinary and the dump until you are fully confident, and take a fresh `pg_dump` immediately
  before `--delete`.
- The files copied to R2 under `vantage/media/` are inert after a restore and can stay or be removed by hand.

## Known differences

- The OG image is not cropped to the social-card size until Phase 6.
- Face crops use an attention focal point instead of Cloudinary's face detection.
- Cloudinary's `f_auto` is replaced by Next.js image optimisation.
- `GET /api/site-settings` (public JSON) changed shape: the eight `*PublicId` image fields
  (`logoPublicId`, `faviconPublicId`, `heroVideoPublicId`, `heroFallbackImagePublicId`,
  `ogImagePublicId`, `aboutHeroImagePublicId`, `aboutHeritageImagePublicId`,
  `aboutStandardsImagePublicId`) are replaced by `logo`, `favicon`, `heroVideo`, `heroFallbackImage`,
  `ogImage`, `aboutHeroImage`, `aboutHeritageImage`, `aboutStandardsImage` (each a PublicImage or
  `null`), and `aboutTeamMembers[].imagePublicId` is now `.image`. No in-repo client reads them.
