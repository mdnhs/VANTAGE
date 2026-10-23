# Admin MK Parity — Phase 5: Media Library + Cloudinary → R2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every image/video VANTAGE shows or stores becomes a `media` row on R2 (prefix `vantage/`), picked through MK's media library + picker, with a one-off idempotent Cloudinary → R2 migration (dry-run / verify), enquiry photos as `media` rows linked to the lead, real usage/delete guards, `assertMediaExists` on every save, retention deleting purged enquiries' photos, and the Cloudinary SDK, signer, upload widget and loader removed. Public site looks the same.

**Architecture:** Phase 1 left the server pipeline (`src/server/lib/media/*`, `media-library-service`, `/admin/media` API, `/uploads/[...key]`). This phase adds: media FK columns beside each legacy `*_public_id` column, an `enquiry_photos` link table, a server resolver that turns a media row (or, until migrated, a legacy Cloudinary id) into a `PublicImage`, the MK library UI/picker (`src/features/media`), and two owner-run scripts (`media:migrate`, `media:cloudinary-cleanup`). Legacy columns, `photo_urls` and the URL-only Cloudinary fallback stay until Phase 11 so no deploy/migrate order can break an image.

**Tech Stack:** sharp, `@aws-sdk/client-s3` (Put/DeleteObject), Drizzle + `pg`, Hono, react-query, RHF + zod v4, Next 16 `'use cache'`/`cacheTag`, next/image, sonner, vitest (unit + integration, `MEDIA_DRIVER=local`).

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§2 goals 12–13, §4 anti-goals, §5.5 uploads, §5.6a cutover, §5.8 VPS) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md` · **MK reference:** `/Users/nazmulhasansourab/ireland/james-whitfield` (`admin/modules/media/*`, `admin/components/schema-form/widgets/media-{widget,picker-dialog}.tsx`, `server/modules/media/{service,usage,assert-media}.ts`, `components/media-image.tsx`)

## Global Constraints

- Branch `feat/admin-mk-parity`; each task in its own worktree (Phase 3 setup, own test DB `vantage_<slot>_test`); `git add <named paths>` only, never `-A`.
- **Runs in parallel with Phases 7 (marketing), 8 (appearance), 9 (AI), 10 (activity/notifications).** Minimise edits to shared files; every shared-file edit is listed under "Shared files" below and nowhere else. Edits to marketing components (Phase 7 adds events, Phase 8 swaps red/fonts to CSS vars) and to quote/contact create paths (Phase 10 adds bell items) are **line-local**: change only the image `src`/prop-type lines and the photo-handling lines; no reformatting, no reordering imports beyond the swapped one.
- **DB migrations:** all Phase 5 schema changes land in Task 1 as one Drizzle migration. Generate it (`yarn db:generate`) only after rebasing on the latest `feat/admin-mk-parity`; the controller renumbers on conflict. No other task generates a migration.
- **Production data steps are owner runbook items, never run by agents:** running `media:migrate` against production, `pg_dump`, and deleting Cloudinary assets. Agents run scripts only against local/test DBs and the `local` media driver. Cloudinary deletion is a separate opt-in script (`media:cloudinary-cleanup --delete`), never part of copying.
- Keys `vantage/media/YYYY/MM/<hash16>-<slug>.<ext>` (Phase 1 `buildMediaKey`); same R2 bucket as MK, nothing outside `vantage/`.
- Upload rules = §5.5: pass-through multipart POST, XHR progress, sniff → sharp → probe → `PutObject`; images/PDF ≤ 20 MB, video (`video/mp4`, `video/webm`, sniff only) ≤ 100 MB; 2 running + 8 queued → 503 (already in `withProcessingSlot`).
- `ImageRef`/`VideoRef` shape stays `{ kind: 'cloudinary', publicId } | { kind: 'media', id } | null`. Widgets only ever emit `media`; `cloudinary` still parses (legacy rows, old revisions) until Phase 11.
- Legacy fallback (until Phase 11): a ref with no media id but a legacy Cloudinary id renders `https://res.cloudinary.com/<cloud>/<image|video>/upload/f_auto,q_auto/<publicId>` (string only, no SDK) using `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, read **server-side only**. Unset cloud name → `null` (component's existing placeholder).
- Any write of a content `xMediaId` also sets its paired legacy `xPublicId` column to `null` (a removed image must not reappear from the fallback).
- MK copy verbatim: widget buttons "Choose image" / "Change image" / "Remove"; picker title "Choose an image" ("Choose a video" for video); search placeholder "Search by name or alt text"; `assertMediaExists` message "Some images were deleted. Choose new ones before saving."; delete-in-use "This file is still in use".
- Public reads that join media add `cacheTag('media')`; media update/replace/delete call `revalidateTag('media', { expire: 0 })` (Phase 4 style).
- Hard rule: every VANTAGE feature keeps working — before/after + 10-image gallery on projects, service icon + image, catalog icon, partner logo, testimonial avatar, hero video + fallback, about images + team photos, quote/contact photos in inbox/detail/kanban views, retention.

## Shared files (controller sequences merges)

| File                                                                                                            | Task  | Edit                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/server/db/schema/index.ts`                                                                                 | 1     | `export * from './enquiry-photos'` (one line)                                                                                                           |
| `src/server/db/schema/relations.ts`                                                                             | 1     | media relations for content tables + `enquiryPhotos`                                                                                                    |
| `src/server/db/schema/media.ts`                                                                                 | 1     | `scope`, `legacySource` columns                                                                                                                         |
| `src/server/db/migrations/*`                                                                                    | 1     | one migration (see DB migrations)                                                                                                                       |
| `src/server/api/index.ts`                                                                                       | 7     | delete the `media` import and `.route('/media', media)` (2 lines)                                                                                       |
| `src/lib/routes/api-routes.ts`                                                                                  | 7     | delete `media.sign`                                                                                                                                     |
| `src/lib/env.ts`, `.env.example`                                                                                | 7     | drop `CLOUDINARY_API_KEY/SECRET`; move `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` from `clientEnv` to `serverEnv` (optional, legacy)                           |
| `next.config.ts`                                                                                                | 7     | `images` block only (headers untouched — Phase 7 owns CSP)                                                                                              |
| `package.json`, `yarn.lock`                                                                                     | 6, 7  | add `media:migrate`, `media:cloudinary-cleanup` scripts; remove `cloudinary`, `next-cloudinary`. On lock conflict the controller re-runs `yarn install` |
| `src/server/services/{quote-request,contact-message}-service.ts`, `src/server/api/{quote-requests,contacts}.ts` | 5     | photo lines only (Phase 10 conflict)                                                                                                                    |
| marketing components (`src/components/marketing/*`, `src/app/(marketing)/**`, `src/app/layout.tsx`)             | 3a, 4 | image `src` lines only (Phases 7/8 conflict)                                                                                                            |

Not touched: `src/lib/admin/nav.ts` (Media item + route gate already exist), `src/lib/auth/permissions.ts` (`media: read/upload/update/delete` exists), `src/lib/content/globals.ts`, `src/features/globals/global-ui.ts`, `src/components/admin/schema-form/registry.ts` (unused `folder` meta stays; Phase 11 cleans).

## DB migrations (Task 1, one file)

1. `media`: add `scope text not null default 'library'` (enum `library|enquiry`, index), `legacy_source text unique` (e.g. `cloudinary:image:vantage/projects/abc`, `cloudinary:video:…`).
2. Media FK columns, `uuid null references media(id) on delete restrict`: `services.icon_media_id`, `services.image_media_id`, `homepage_catalogs.icon_media_id`, `partner_logos.logo_media_id`, `projects.before_image_media_id`, `projects.after_image_media_id`, `project_gallery_images.media_id`, `testimonials.avatar_media_id`.
3. Drop NOT NULL on `partner_logos.logo_public_id`, `projects.before_image_public_id`, `projects.after_image_public_id`, `project_gallery_images.image_public_id`.
4. New `enquiry_photos`: `id uuid pk`, `quote_request_id uuid null → quote_requests(id) on delete cascade`, `contact_message_id uuid null → contact_messages(id) on delete cascade`, `media_id uuid not null → media(id) on delete restrict`, `position int not null`, `created_at`; check exactly one parent set; index on each parent.

Deferred to Phase 11 (do not do now): drop legacy `*_public_id` columns, `photo_urls`, `site_settings`, the Cloudinary URL fallback, the `cloudinary` ref variant.

## Review Focus

1. Admin removes an optional image (service icon, testimonial avatar) on an already-migrated or legacy row → public site shows the placeholder, not the old Cloudinary image via fallback. → Task 3a test.
2. A media item used by a setting or content row is deleted in the library → 409 "This file is still in use" with the usage list; saving a setting/content row naming a soft-deleted or unknown media id → 422 `_media`. → Task 1 + Task 4 tests.
3. Public pages render the same image set before `media:migrate` (legacy fallback), after it (R2 URLs), and half-way (mixed) — no `null` where a ref existed. → Task 3a/4 resolver tests + Task 6 `--verify`.
4. Public form photos that are not decodable images (raw HEIC, a PDF renamed `.jpg`, > 20 MB, a 5th photo, a non-`data:image/` string) are skipped or refused per rule while the enquiry still saves; anonymous uploads never appear in the library grid. → Task 5 tests.
5. `media:migrate` re-run or interrupted half way creates no duplicates (`legacy_source` unique); a Cloudinary 404 is reported `MISSING` and leaves that ref unchanged; `--verify` exits 1 while any ref is unmigrated. → Task 6 tests.

---

## Task order and concurrency

- **Task 1** first, alone (schema + server core every other task consumes).
- Then **in parallel**: Task 2 (library UI + picker), Task 3a (content server + public content images), Task 4 (settings refs + public chrome images), Task 5 (enquiry photos + retention). Disjoint files.
- **Task 3b** (content admin forms) after 2 + 3a.
- **Task 6** (migration scripts + runbook) after 3a, 4, 5.
- **Task 7** (remove Cloudinary) last.

### Task 1: Media core — schema, storage delete, usage, guards, resolver

**Files:**

- Modify: `src/server/db/schema/{media,services,homepage-catalogs,partner-logos,projects,project-gallery-images,testimonials,relations,index}.ts`; create `src/server/db/schema/enquiry-photos.ts`; generate migration.
- Modify: `src/server/lib/media/storage.ts` (+ test), `src/server/repositories/media-repository.ts`, `src/server/services/media-library-service.ts`, `src/server/api/admin-media.ts`, `src/validations/media-schema.ts`.
- Create: `src/server/lib/media/{assert-media,usage,resolve,legacy-cloudinary}.ts`, `src/lib/media/public-image.ts`, `src/lib/cache/media-tag.ts` (`MEDIA_TAG = 'media'`).
- Test: `tests/integration/media-api.test.ts` (extend), `tests/integration/media-usage.test.ts`, `src/server/lib/media/resolve.test.ts`; `tests/test-env.mjs` gains `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'demo'`.

**Interfaces (Produces):**

- `StorageDriver.remove(key: string): Promise<void>` — S3 `DeleteObjectCommand`; local `rm({ force: true })`; refuses keys failing `mediaKeyPattern`.
- `type PublicImage = { id: string | null; src: string; mimeType: string | null; width: number | null; height: number | null; alt: string; blurDataUrl: string | null; focal: { x: number; y: number } }` (`src/lib/media/public-image.ts`, client-safe).
- `type LegacyRef = { publicId: string; resourceType: 'image' | 'video' }`; `legacyCloudinaryUrl(ref: LegacyRef): string | null`.
- `toPublicImage(row: MediaRow | null | undefined, legacy?: LegacyRef | null): PublicImage | null` — live row wins (`focal` from `focalX/Y`, `alt` = `''` when `isDecorative`); else legacy URL with null dims, alt `''`, focal 0.5/0.5; else `null`. Soft-deleted row counts as missing.
- `loadPublicImages(ids: string[]): Promise<Record<string, PublicImage>>` — `'use cache'`, `cacheTag(MEDIA_TAG)`, `cacheLife('max')`; ids sorted+deduped before the call.
- `assertMediaExists(ids: string[], db?: DbLike): Promise<void>` — port MK; throws `ApiError` 422 `VALIDATION_ERROR` with details `{ _media: ['Image <id> no longer exists', …] }`.
- `type MediaUse = { kind: 'setting' | 'content' | 'enquiry'; id: string; label: string; href: string | null }`; `mediaUsage(db: DbLike, id: string): Promise<MediaUse[]>` — `settings.value::text like '%<id>%'` (label = `SETTINGS_PAGE_LABELS`/`GLOBAL_LABELS`, href = settings/website page), each FK column of migration 2, `enquiry_photos` (kind `enquiry`, href `/dashboard/quotes/<id>` or `/dashboard/contacts/<id>`).
- `mediaLibraryService.ingest({ bytes: Buffer; filename: string; actorId: string | null; scope: 'library' | 'enquiry'; legacySource?: string; focal?: { x: number; y: number } }): Promise<MediaRow>` — process + store + insert; when `legacySource` already exists returns that row untouched (idempotent). `upload()` becomes a thin wrapper (`scope: 'library'`).
- `mediaLibraryService.update(actor, id, patch)`, `.replace(actor, id, file)`, `.remove(actor, id)` — actor-first; an actor whose only media-granting role is `author` may only change rows with `createdBy === actor.userId` (else 403 "You can only edit your own files"); `remove` takes `lock table … in share row exclusive mode` over the referrer tables, runs `mediaUsage`, throws 409 `"This file is still in use"` with `details.usage`, else soft-deletes. Each mutation writes `audit()` (`media.upload|update|replace|delete`, top-level diff for update) and revalidates `MEDIA_TAG`.
- `hardDeleteEnquiryMedia(ids: string[]): Promise<number>` (service) — deletes rows where `scope = 'enquiry'` and no `enquiry_photos` link, then `storage.remove(key)` best-effort (failures logged as counts only).
- List API: `mediaListQuerySchema` gains `ids` (comma-separated, ≤ 100 uuids); list always filters `scope = 'library'` and `deleted_at is null`; `GET /admin/media/:id/usage` returns real usage.

- [ ] **Step 1: Failing tests**
  - `media-api.test.ts`: `DELETE` an item referenced by `settings` value → 409, body `details.usage[0].kind === 'setting'`; unreferenced → 200 and gone from list; author updating another user's item → 403, own item → 200; list `?ids=a,b` returns exactly those; enquiry-scope row never listed; upload/update/delete each write one `audit_logs` row.
  - `media-usage.test.ts`: one row per referrer type (setting, `services.icon_media_id`, `project_gallery_images.media_id`, `enquiry_photos`) found with correct `href`.
  - `assertMediaExists`: soft-deleted id and random uuid and malformed id → 422 listing all three; live ids → resolves.
  - `resolve.test.ts`: live row → `src = row.url`, focal from row; soft-deleted row + legacy → legacy URL `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/vantage/x` (cloud name `demo` in test env); video legacy uses `/video/upload/`; nothing → `null`; cloud name unset → `null`.
  - `storage.test.ts`: local `remove` deletes file, missing file no throw, bad key throws.
- [ ] **Step 2:** Run `yarn vitest run tests/integration/media-api.test.ts tests/integration/media-usage.test.ts src/server/lib/media` → FAIL.
- [ ] **Step 3:** Schema + migration (rebase first), then implement the interfaces above.
- [ ] **Step 4:** Same command → PASS; `yarn tsc --noEmit`.
- [ ] **Step 5: Commit** `feat(media): add media references, usage guard and public image resolver`

### Task 2: Media library screen + picker (parallel with 3a, 4, 5)

**Files:**

- Create: `src/features/media/{services/api.ts,hooks/use-media.ts,upload.ts,upload.test.ts}`, `src/features/media/components/{media-view,media-grid,media-details-sheet,focal-picker,focal-picker.test,upload-dropzone,media-picker-dialog,media-field,media-gallery-field}.tsx`, `src/app/(main)/(protected)/(dashboard_layout)/dashboard/media/page.tsx`.
- Modify: `src/components/admin/schema-form/widgets/{image,video}-widget.tsx` (render `MediaField`); delete `ref-widget.tsx`; update `schema-form.test.tsx` fixture to a `media` ref.

**Interfaces:**

- Consumes: Task 1 `/admin/media` API (`ids`, usage, 409/403/422 bodies), `MediaItem` from `media-library-service`.
- Produces:
  - `MediaField(props: { value: ImageRef | VideoRef | undefined; onChange(v: { kind: 'media'; id: string } | null): void; kind: 'image' | 'video'; label: string; nullable?: boolean; disabled?: boolean })` — MK `MediaWidget` layout (80px thumb, Choose/Change, Remove when nullable). A `cloudinary` value shows "Legacy image — choose a new one to replace it" with Change/Remove.
  - `MediaGalleryField(props: { value: string[]; onChange(ids: string[]): void; max: number; label: string })` — thumbs in order, add via picker (multi-pick until `max`), remove, move up/down.
  - `MediaPickerDialog(props: { open; onOpenChange; onPick(item: MediaItem): void; selectedId?: string | null; kind: 'image' | 'video' })` — MK dialog + an "Upload" button (UploadDropzone) so a form can still upload in place; picks the new item on success.
  - `uploadMedia(file: File, onProgress: (pct: number) => void): Promise<MediaItem>` (XHR, port MK `upload.ts`); `checkFile(file, kind)` client pre-check: images/PDF ≤ 20 MB, video mp4/webm ≤ 100 MB, MK messages.
- Media page = MK `MediaView`: search, type filter (All / Images / Videos / PDFs), "Missing alt text" filter, grid with load-more (40/page), upload dropzone with per-file progress, details sheet (alt with `/300` counter, decorative toggle, caption, focal picker, usage list with links, Replace, Delete → 409 shows the usage list in the toast/dialog). Page gate: `requirePermission` for `/dashboard/media` as other Phase 3 pages.

- [ ] **Step 1: Failing tests** — `upload.test.ts`: `checkFile` rejects 21 MB jpeg, accepts 90 MB mp4 for `video`, rejects mp4 for `image`; XHR progress forwards percentages, 503 → MK busy message, 413 → too-large message. `focal-picker.test.tsx`: click at 25%/75% → `onChange({x:0.25,y:0.75})`, arrow keys move 0.05. `schema-form.test.tsx`: image widget with `media` value renders "Change image"; Remove emits `null`.
- [ ] **Step 2:** `yarn vitest run src/features/media src/components/admin/schema-form` → FAIL.
- [ ] **Step 3:** Implement (port MK files, VANTAGE folders/shadcn components).
- [ ] **Step 4:** Tests PASS; `yarn tsc --noEmit && yarn lint`; browser: upload jpg + mp4, edit alt/focal, delete in-use item shows usage.
- [ ] **Step 5: Commit** `feat(media): add media library screen and picker`

### Task 3a: Content tables on media — server + public content images (parallel with 2, 4, 5)

**Files:**

- Modify: `src/validations/{service,homepage-catalog,partner-logo,project,testimonial}-schema.ts`; `src/server/repositories/{service,homepage-catalog,partner-logo,project,testimonial}-repository.ts`; matching `*-service.ts` (add `cacheTag(MEDIA_TAG)` to cached reads, `assertMediaExists` on create/update); feature `types/index.ts` for those five.
- Modify (src lines only): `src/app/(marketing)/services/page.tsx`, `src/components/marketing/{services-section,stitch-services,service-feature-block,quote-form,project-grid,stitch-case-studies,testimonials-section,partner-logos-strip}.tsx`.
- Test: `tests/integration/content-media.test.ts`.

**Interfaces:**

- Consumes: Task 1 `toPublicImage`, `assertMediaExists`, relations.
- Produces (input → stored → read):
  | Entity                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Input field (uuid)                                                                   | Read field (`PublicImage \| null`)                    | Legacy fallback column                               |
  | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------- |
  | service                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `iconMediaId?`, `imageMediaId?` (nullable)                                           | `icon`, `image`                                       | `iconPublicId`, `imagePublicId`                      |
  | homepage catalog                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `iconMediaId?`                                                                       | `icon`                                                | `iconPublicId`                                       |
  | partner logo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `logoMediaId` (required)                                                             | `logo`                                                | `logoPublicId`                                       |
  | project                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `beforeImageMediaId`, `afterImageMediaId` (required), `galleryMediaIds: uuid[] ≤ 10` | `beforeImage`, `afterImage`, `gallery: PublicImage[]` | `before/afterImagePublicId`, gallery `imagePublicId` |
  | testimonial                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `avatarMediaId?`                                                                     | `avatar`                                              | `avatarPublicId`                                     |
  | Rows returned by admin and public reads carry both the `*MediaId` and the resolved field. In this task the `*MediaId` input fields are **added** (optional) beside the legacy `*PublicId` ones so the existing admin forms still compile; required-ness (`logoMediaId`, before/after) is a refine "media id or legacy id". Task 3b removes the legacy input fields and makes the media ids required. Writing any `*MediaId` key (including `null`) nulls the paired legacy column; a gallery replace given `galleryMediaIds` writes `media_id` with `image_public_id = null`. |
- Components: `cldUrl(x.publicId, …)` → `x.image.src` (or `.icon/.logo/.avatar`); add `style={{ objectPosition: \`${focal.x*100}% ${focal.y*100}%\` }}` only where the old URL cropped (`crop: 'fill'`). `quote-form.tsx`: only the service icon line.

- [ ] **Step 1: Failing tests** (`content-media.test.ts`): create service with live `iconMediaId` → public list `icon.src === media.url`; with soft-deleted id → 422 `_media`; legacy-only row (`icon_public_id` set, media id null) → `icon.src` is the legacy URL; update with `iconMediaId: null` on that row → public `icon === null` and `icon_public_id` is null in DB (Review Focus 1); project with 3 gallery ids keeps order; partner logo with neither id → 422; media alt update reaches public list after `revalidateTag` (service read tags `media`).
- [ ] **Step 2:** `yarn vitest run tests/integration/content-media.test.ts` → FAIL.
- [ ] **Step 3:** Implement; repositories load media via `with: { iconMedia: true, … }`.
- [ ] **Step 4:** PASS; `yarn tsc --noEmit` clean (admin forms untouched and still compiling); public pages services/our-work/home visually unchanged in browser.
- [ ] **Step 5: Commit** `feat(media): store content images as media references`

### Task 3b: Content admin forms and tables on the picker (after 2 + 3a)

**Files:** Modify `src/features/{services,homepage-catalogs,partner-logos,projects,testimonials}/components/*-form.tsx`, `src/features/{homepage-catalogs,partner-logos}/components/list/*-table.tsx`, and the five `src/validations/*-schema.ts` from 3a (drop legacy `*PublicId` / `galleryImagePublicIds` input fields; `logoMediaId`, `beforeImageMediaId`, `afterImageMediaId` required uuids), `tests/integration/content-media.test.ts` (partner logo without `logoMediaId` → 422).

- `CloudinaryUpload` → `MediaField` (service icon + image, catalog icon, partner logo, testimonial avatar) / two `MediaField`s "Before" and "After" + `MediaGalleryField max={10}` "Gallery (up to 10 images)" on projects. Tables use the resolved `logo.src` / `icon.src` thumbnails.
- [ ] **Step 1:** Add the 422 case above and `src/features/projects/components/project-form.test.tsx`: picking before/after/gallery submits `{ beforeImageMediaId, afterImageMediaId, galleryMediaIds }` in pick order; required before/after error shows when empty.
- [ ] **Step 2–4:** RED → implement → GREEN; `yarn tsc --noEmit && yarn lint`; browser: create + edit each entity, reorder gallery, public page shows new image.
- [ ] **Step 5: Commit** `feat(admin): use the media picker for content images`

### Task 4: Settings refs — guard, restore translation, public chrome images (parallel with 2, 3a, 5)

**Files:**

- Modify: `src/lib/content/image-ref.ts` (+ test), `src/server/services/globals-service.ts`, `src/server/lib/settings/public-settings.ts` (+ test), `src/server/services/site-settings-service.ts` (`getPublic` loads images), `src/features/about-page/defaults.ts`.
- Modify (src lines only): `src/app/layout.tsx` (OG image), `src/app/(marketing)/{layout,page}.tsx`, `src/app/(marketing)/about/page.tsx`, `src/components/marketing/{stitch-header,footer,stitch-hero,hero-section,about-hero,heritage-section,standards-section,team-section}.tsx`, `src/features/auth/components/auth-brand.tsx`, `src/components/admin/shell/brand-mark.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(main)/(protected)/(dashboard_layout)/layout.tsx`.
- Test: `tests/integration/globals-api.test.ts` (extend), `src/server/lib/settings/public-settings.test.ts`.

**Interfaces:**

- `collectMediaIds(value: unknown): string[]` and `mapRefs(value: unknown, fn: (ref: NonNullable<ImageRef>, path: string[]) => ImageRef): unknown` in `image-ref.ts` (pure, deep walk; `path` lets callers see `…'video'` keys). Task 6 reuses both.
- `saveGlobal`: after zod parse, `assertMediaExists(collectMediaIds(value))`. `restoreGlobal`: before saving, `mapRefs` replaces `cloudinary` refs whose `legacy_source` (`cloudinary:<image|video>:<publicId>`, video when last path key is `video`) exists with `{ kind: 'media', id }`; unknown ones stay `cloudinary`.
- `composePublicSettings(g: PublicGlobals, images: Record<string, PublicImage>): PublicSiteSettings` — the eight `*PublicId` fields (`logo, favicon, heroVideo, heroFallbackImage, ogImage, aboutHeroImage, aboutHeritageImage, aboutStandardsImage`) become `PublicImage | null` fields of those names; `aboutTeamMembers[].imagePublicId` → `.image`. `PublicSiteSettings = Omit<SiteSettings, 'id' | 'updatedAt' | <the 8 legacy columns> | 'aboutTeamMembers'> & { … }`. A `cloudinary` ref resolves via `toPublicImage(null, legacy)`; legacy-row fallback path (key never saved) behaves the same. `FALLBACK_SETTINGS` image fields `null`.
- Hero: `<source src={heroVideo.src} type={heroVideo.mimeType ?? 'video/mp4'} />`; fallback image `heroFallbackImage?.src ?? <existing default>`. OG: `ogImage?.src` (uncropped; Phase 6 enforces 1200×630).

- [ ] **Step 1: Failing tests** — `globals-api.test.ts`: PUT `site` with soft-deleted logo id → 422 `_media`; restore a revision holding `{kind:'cloudinary',publicId:'p'}` when a media row has `legacy_source='cloudinary:image:p'` → saved value holds `{kind:'media',id}`; hero `video` ref uses `cloudinary:video:` lookup. `public-settings.test.ts`: media ref → `logo.src = row.url`; cloudinary ref → legacy URL; missing image map entry → `null`; Phase 4 snapshot strings unchanged.
- [ ] **Step 2:** `yarn vitest run tests/integration/globals-api.test.ts src/server/lib/settings src/lib/content` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `yarn tsc --noEmit`; browser: home (video hero), about, header/footer logo, admin brand mark, auth brand unchanged.
- [ ] **Step 5: Commit** `feat(media): resolve settings images from the media library`

### Task 5: Enquiry photos through the pipeline + retention (parallel with 2, 3a, 4)

**Files:**

- Create: `src/server/lib/media/enquiry-photos.ts` (+ integration test `tests/integration/enquiry-photos.test.ts`), `src/lib/media/enquiry-photo.ts` (type).
- Modify: `src/validations/{quote-request,contact-message}-schema.ts`, `src/server/api/{quote-requests,contacts}.ts`, `src/server/services/{quote-request,contact-message}-service.ts`, `src/server/repositories/{quote-request,contact-message}-repository.ts`, `src/server/services/retention-service.ts`, `tests/integration/retention.test.ts`, `src/components/marketing/contact-form.tsx` (cap 4 photos), admin photo views `src/features/quote-requests/components/{detail/quote-detail-view,inbox/quote-inbox-detail,inbox/quote-inbox-item,kanban/kanban-card,list/quote-request-table}.tsx`, `src/features/contact-messages/components/{detail/contact-detail-view,inbox/contact-inbox-detail,inbox/contact-inbox-item,list/contact-message-table}.tsx`. Delete `src/server/lib/inquiry-photos.ts`.

**Interfaces:**

- `type EnquiryPhoto = { id: string | null; url: string; width: number | null; height: number | null }`.
- `storeEnquiryPhotos(dataUrls: string[] | undefined): Promise<string[]>` — accepts only `data:image/(jpeg|png|webp|avif);base64,`, first 4, each decoded ≤ 20 MB, `ingest({ scope: 'enquiry', actorId: null, filename: 'enquiry-photo.<ext>' })`; a refused/failed photo is skipped (console count only, no customer data). Returns media ids in order.
- `linkEnquiryPhotos(tx, parent: { quoteRequestId } | { contactMessageId }, mediaIds: string[])` inside the create transaction.
- Public input: `photoUrls: z.array(z.string().startsWith('data:image/').max(30_000_000)).max(4).optional()` (any other string or a 5th photo → 422; a data URL that fails sniff/decode is skipped and the enquiry still saves; data URLs, field name kept so `quote-form`/`stitch-estimator` need no change). Admin `POST /quote-requests/admin` schema drops `photoUrls`. Repositories no longer write `photo_urls`.
- Read models (admin detail/list): `photos: EnquiryPhoto[]` = linked media (by `position`) followed by legacy `photo_urls` entries (`id: null`). Views use `photos` instead of `photoUrls`.
- Retention: inside the delete transaction collect `media_id`s of `enquiry_photos` for deleted parents (before delete; cascade removes links); after commit `hardDeleteEnquiryMedia(ids)`. Remove `deleteCloudinaryPhotos`/`cloudinaryPublicId` (Task 6 owns URL parsing). Legacy `photo_urls` of purged rows are counted in `RetentionResult.legacyPhotos` (left for the cleanup script). New sweep: enquiry-scope media with no link and `created_at` older than 24 h are hard-deleted (`RetentionResult.orphanPhotos`), included in dry-run counts.

- [ ] **Step 1: Failing tests** — `enquiry-photos.test.ts`: public quote with 2 valid JPEG data URLs → 201, 2 `enquiry_photos` rows in order, media `scope='enquiry'`, not in `/admin/media` list; 5 photos → 422; a PNG-header-but-garbage photo and an `https://evil` string → skipped/422 respectively with enquiry saved for the skipped case; contact message same path; admin detail returns `photos` with legacy URL last. `retention.test.ts`: purged quote's media row and local file gone; linked-but-kept quote's media untouched; orphan older than 24 h removed, younger kept; dry-run counts only.
- [ ] **Step 2:** `yarn vitest run tests/integration/enquiry-photos.test.ts tests/integration/retention.test.ts tests/integration/public-forms.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; browser: submit quote with photos on public site, see them in inbox detail + kanban card.
- [ ] **Step 5: Commit** `feat(enquiries): store enquiry photos in the media library`

### Task 6: `media:migrate` + `media:cloudinary-cleanup` + runbook (after 3a, 4, 5)

**Files:**

- Create: `src/server/lib/media/cloudinary-migration.ts` (+ `tests/integration/cloudinary-migration.test.ts`), `scripts/migrate-cloudinary-media.ts`, `scripts/cloudinary-cleanup.ts`, `docs/setup/production-cutover-phase-5.md`.
- Modify: `package.json` scripts `"media:migrate": "tsx scripts/migrate-cloudinary-media.ts"`, `"media:cloudinary-cleanup": "tsx scripts/cloudinary-cleanup.ts"`.

**Interfaces:**

- `migrateCloudinaryMedia(opts: { dryRun: boolean; fetchAsset?: (url: string) => Promise<Buffer | null>; cloudName: string }): Promise<MigrationReport>`; `verifyCloudinaryMigration(): Promise<{ ok: boolean; problems: string[] }>`; `type MigrationReport = { refs: number; copied: number; reused: number; missing: string[]; failed: string[]; rewritten: { columns: number; settings: string[]; enquiryPhotos: number } }`. `fetchAsset` defaults to `fetch` with 60 s timeout, 100 MB cap.
- Sources (legacy id → `legacySource`): the 8 content columns of migration 2 (only rows whose media id is null); every `settings` row value (not revisions) via `mapRefs` (video when last path key is `video`); `quote_requests.photo_urls` / `contact_messages.photo_urls` URLs on `res.cloudinary.com` (publicId parsed from URL, moved here from retention) for rows with no `enquiry_photos`.
- Download URLs: image `https://res.cloudinary.com/<cloud>/image/upload/<publicId>`; if `processUpload` refuses the type (HEIC/GIF/SVG), retry once with `/image/upload/f_png/<publicId>.png`; video `/video/upload/q_auto,vc_h264/<publicId>.mp4`. 404 → `missing`, ref untouched. Each asset → `ingest({ scope, legacySource, actorId: null, filename: <last publicId segment> })`.
- Face-gravity fields (testimonial avatar, about team member image): set focal from sharp `resize(…, { fit: 'cover', position: sharp.strategy.attention })` output `info.attentionX/Y` ÷ dimensions; other images keep 0.5/0.5.
- Rewrites: content column → set `*_media_id`, keep legacy id (fallback stays valid until Phase 11); settings → `settingsRepository.save` as new version, note `"Media moved to R2"`, actor null, audit `media.migrate`; photos → `enquiry_photos` rows. Refuses (exit 1, nothing written) unless every `PUBLIC_SETTINGS_KEYS` row exists: "Run yarn settings:migrate first".
- CLI: `yarn media:migrate --dry-run` (lists each ref: `COPY|REUSE|MISSING <source> <legacySource>`, nothing written/uploaded), `yarn media:migrate`, `yarn media:migrate --verify` (exit 1 with `UNMIGRATED <where>` for any remaining cloudinary ref/null media id with legacy id/unlinked photo URL, and `UNREADABLE <mediaId>` when `readMediaBytes` fails on a migrated row). Uses `MEDIA_DRIVER`/S3 env as the app does.
- Cleanup (opt-in, separate): `yarn media:cloudinary-cleanup` defaults to dry run (counts per folder under prefix `vantage/`, image + video, via Cloudinary Admin REST API with `fetch` + basic auth from `CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET` process env — no SDK); deletes only with `--delete`, and only after `verifyCloudinaryMigration().ok`, in batches of 100.

- [ ] **Step 1: Failing tests** (`cloudinary-migration.test.ts`, local driver, injected `fetchAsset` serving fixture JPEG/MP4 and returning `null` for one id): dry run writes nothing; real run copies 1 service icon, 1 gallery image, `site.logo`, `page.home.hero.video` (stored `video/mp4`), 1 quote photo URL; `settings` versions +1 with note; second run → all `REUSE`, zero new media rows (Review Focus 5); missing id → `missing` and ref unchanged; `--verify` false while missing remains, true after the fixture is served and re-run; refuses when `page.home` row is absent; cleanup refuses `--delete` while verify fails (injected API client).
- [ ] **Step 2:** `yarn vitest run tests/integration/cloudinary-migration.test.ts` → FAIL.
- [ ] **Step 3:** Implement library + both CLIs; write the runbook (below).
- [ ] **Step 4:** PASS; run `yarn media:migrate --dry-run` against the local dev DB only.
- [ ] **Step 5: Commit** `feat(media): add Cloudinary to R2 migration and cleanup scripts`

Runbook `docs/setup/production-cutover-phase-5.md` (owner executes; format as Phase 4's): 1. `pg_dump "$DATABASE_URL" -Fc -f vantage-before-phase5.dump`. 2. Rehearse steps 3–6 on a fresh copy of production. 3. Ensure prod env has `MEDIA_DRIVER=s3`, S3 vars, `MEDIA_PUBLIC_URL`, and keeps `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (fallback). 4. Deploy (applies migration); site keeps rendering legacy Cloudinary URLs. 5. `yarn settings:migrate --verify` must pass, then `yarn media:migrate --dry-run`, review `MISSING`, then `yarn media:migrate`. 6. `yarn media:migrate --verify` → OK; restart app (CLI cannot expire page cache). Re-run 5–6 any time (idempotent). 7. Weeks later, optional: `yarn media:cloudinary-cleanup` (dry run), then `--delete`. Rollback: restore dump; R2 objects under `vantage/media/` are inert. Known differences: OG image uncropped until Phase 6; face crops use attention focal point; Cloudinary `f_auto` replaced by Next image optimisation.

### Task 7: Remove Cloudinary (last)

**Files:**

- Delete: `src/lib/cloudinary/{server,loader,url}.ts`, `src/components/form/cloudinary-upload.tsx`, `src/server/api/media.ts`.
- Modify: `src/server/api/index.ts`, `src/lib/routes/api-routes.ts`, `src/lib/env.ts`, `.env.example`, `next.config.ts`, `package.json`/`yarn.lock` (remove `cloudinary`, `next-cloudinary`), `src/server/db/seed-content.ts` (seed images via `mediaLibraryService.ingest` from `public/assets/marketing`, `legacySource: 'seed:<file>'` for idempotency, writes `*_media_id`).
- Create: `src/lib/no-cloudinary.test.ts`.

- `next.config.ts` `images`: drop `loader`/`loaderFile`; MK settings `formats: ['image/avif','image/webp']`, `deviceSizes` / `imageSizes` / `qualities: [75, 90]` / `minimumCacheTTL: 31536000` as MK; `remotePatterns: [...mediaRemotePatterns(), { protocol: 'https', hostname: 'res.cloudinary.com' }]` (legacy, Phase 11 removes). No `localPatterns` (VANTAGE serves many `/public` paths).
- Env: remove `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from schema and `.env.example`; `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` moves to `serverEnv` (optional, comment "legacy fallback until Phase 11"); `legacy-cloudinary.ts` reads it via `serverEnv()`.
- [ ] **Step 1: Failing test** `no-cloudinary.test.ts`: no file under `src/` imports `cloudinary`, `next-cloudinary` or `@/lib/cloudinary`; the string `res.cloudinary.com` appears only in `src/server/lib/media/legacy-cloudinary.ts` and `src/server/lib/media/cloudinary-migration.ts`; no client file (`'use client'`) references `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- [ ] **Step 2–4:** RED → delete/modify → GREEN; `yarn tsc --noEmit && yarn lint && yarn test && yarn build`.
- [ ] **Step 5: Commit** `chore(media): remove Cloudinary SDK, signer, upload widget and loader`

### Phase exit check

- [ ] `yarn tsc --noEmit`, `yarn lint` 0 errors, `yarn test` green, `yarn build` OK.
- [ ] Local dev rehearsal: point dev DB at a Cloudinary-backed copy, `yarn media:migrate --dry-run` → run → `--verify` OK with `MEDIA_DRIVER=local`.
- [ ] Controller browser check: Media screen (upload image + video, alt/focal/replace, delete-in-use blocked); every upload field uses the picker (settings identity/branding, home hero video + fallback, about images + team, services, catalogs, partner logos, projects before/after/gallery, testimonials); public home/services/our-work/about/insurance/process/contact visually unchanged; quote with photos → inbox detail shows them.
