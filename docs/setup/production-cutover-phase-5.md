# Phase 5 production cutover (media migration)

Stub: Task 6 owns the full runbook (media:migrate, verify, backups, Cloudinary cleanup).

## Known differences

- `GET /api/site-settings` (public JSON) changed shape: the eight `*PublicId` image fields
  (`logoPublicId`, `faviconPublicId`, `heroVideoPublicId`, `heroFallbackImagePublicId`,
  `ogImagePublicId`, `aboutHeroImagePublicId`, `aboutHeritageImagePublicId`,
  `aboutStandardsImagePublicId`) are replaced by `logo`, `favicon`, `heroVideo`, `heroFallbackImage`,
  `ogImage`, `aboutHeroImage`, `aboutHeritageImage`, `aboutStandardsImage` (each a PublicImage or
  `null`), and `aboutTeamMembers[].imagePublicId` is now `.image`. No in-repo client reads them.
