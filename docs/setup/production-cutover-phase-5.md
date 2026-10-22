# Phase 5 production cutover (media migration)

The owner runs this; agents never run it against production. Copying is safe to repeat and
never deletes anything. The deploy alone changes nothing visible: until the migration runs, the
site keeps rendering the legacy Cloudinary URLs.

## Steps

1. **Back up first.** `pg_dump "$DATABASE_URL" -Fc -f vantage-before-phase5.dump`
2. **Rehearse steps 3-6 on a fresh copy of production** (restore the dump into a scratch database and
   point `DATABASE_URL` at it) before touching the real one.
3. **Check the production environment:** `MEDIA_DRIVER=s3`, the S3 variables, `MEDIA_PUBLIC_URL`,
   and keep `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set (it powers the fallback until Phase 11).
   The migration reads the originals from Cloudinary, so the cloud name must be correct.
4. **Deploy.** This applies the Phase 5 database migration. Nothing is converted yet.
5. **Migrate:**
   1. `yarn settings:migrate --verify` must pass first (the media migration refuses with
      "Run yarn settings:migrate first" if a public settings key is missing).
   2. `yarn media:migrate --dry-run`: one line per reference, `COPY | REUSE | MISSING | BLOCKED`.
      Review every `MISSING` (Cloudinary no longer has the file; its reference stays as it is) and
      every `BLOCKED` (that file was deleted in the library on purpose, so it is never relinked).
   3. `yarn media:migrate`: copies each file into the media library (R2), then points the
      service/catalog/logo/project/testimonial images, project galleries, the settings documents
      (new version, note "Media moved to R2") and the legacy enquiry photo URLs (as enquiry
      photos) at the copies. The old Cloudinary ids stay in place.
6. **Verify:** `yarn media:migrate --verify` prints `OK` and exits 0. Any `UNMIGRATED <where>` or
   `UNREADABLE <mediaId>` line is a problem: fix or re-run step 5 (idempotent, safe any time).
   Then **restart the app**: the CLI cannot expire the page cache.
   `yarn settings:migrate --verify` keeps passing after this step.
7. **Weeks later, optional:** `yarn media:cloudinary-cleanup` is a dry run (counts per folder under
   `vantage/`, images and videos). Only when you are certain, `yarn media:cloudinary-cleanup --delete`
   removes them in batches of 100. It refuses unless the migration verifies, and it needs
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in the environment.
   Deleted Cloudinary assets cannot be restored.

## Behaviour to know

- Project galleries that still have old-storage images are read-only in the admin ("It can be edited
  after the media migration runs"); step 5 moves them to the library and unlocks editing.
- Files Cloudinary cannot serve as a supported type (HEIC, GIF, SVG) are fetched once as a PNG.
- About-page team photos and testimonial avatars get an automatic focal point (attention
  detection) so the portrait crop stays on the face; adjust it in the Media library if needed.
- A re-run reuses files by their `legacy_source` (`cloudinary:image|video:<publicId>`); it never
  uploads the same asset twice.

## Rollback

Restore `vantage-before-phase5.dump`. The files copied to R2 under `vantage/media/` are inert and
can stay or be removed by hand.

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
