# Admin MK Parity — Phase 1: Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give VANTAGE the auth-independent backend foundations the MK-parity admin builds on: test infra, env + VPS build, encrypted secrets, `settings`/`revisions` storage, the R2 media pipeline with a `media` table and upload API, and an SMTP mailer that degrades gracefully when SMTP is absent.

**Architecture:** Port MK's server libraries (`/Users/nazmulhasansourab/ireland/james-whitfield`, "MK") into VANTAGE's layout (`src/server/lib/*`, `src/server/db/schema/*`, Hono routes in `src/server/api/*`, services in `src/server/services/*`), adapting to VANTAGE's `ApiError(code, message, status, causes)`, `ok()` envelope and `serverEnv()`. MK tests are ported alongside each file. Nothing in the admin UI or public site changes in this phase; Cloudinary keeps working.

**Tech Stack:** Next.js 16.3 (`src/app`, cacheComponents on), Hono, Drizzle 0.45 + `pg`, zod v4, vitest, `@aws-sdk/client-s3`, `sharp`, `nodemailer`, Docker Postgres 18.

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md`

## Global Constraints

- Branch `feat/admin-mk-parity`. Stage only the files your task names (`git add <paths>`); never `git add -A` — the tree holds unrelated uncommitted landing-page work.
- Read `node_modules/next/dist/docs/` before touching Next config/APIs (AGENTS.md).
- Package manager `yarn` (v1). Pin exact versions: use the version MK's `package.json` pins for any dependency MK also uses.
- R2: same bucket as MK, every VANTAGE key under prefix `vantage/` (`MEDIA_KEY_PREFIX=vantage`). Keys `vantage/media/YYYY/MM/<sha256-16hex>-<slug≤60>.<ext>`.
- Upload limits: images/PDF 20 MB (MK `MAX_UPLOAD_BYTES`); video (`video/mp4`, `video/webm`) 100 MB, sniffed but not processed by sharp.
- Secrets encrypted with VANTAGE's own `APP_ENCRYPTION_KEY` (32 random bytes, base64) — never MK's key.
- SMTP is optional: `SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, MAIL_FROM`. Absent → the app works; mail calls return "not configured" instead of throwing.
- Never print secret values (R2 keys, encryption key, SMTP pass) in output, logs, commits or chat.
- Code style: single quotes, 2-space, match surrounding comment density; VANTAGE `ApiError` + `ok()` envelope.
- Local DB: Docker Postgres at `localhost:5433` (`docker-compose.yml`), dev DB `vantage`, test DB `vantage_test`.

## Review Focus

1. A file renamed `.jpg` that is not an image (or is a PDF/SVG/HTML) → rejected with 415 "That file type isn't supported", never stored. → Task 5 test `rejects disguised non-image`.
2. Upload over the cap (20 MB image / 100 MB video) → 413 with a human message, before sharp runs. → Task 5 + Task 6 tests.
3. More uploads than the processing queue allows (2 running + 8 queued) → 503 "busy, try again", not a hung request. → Task 5 test `withProcessingSlot rejects when queue full`.
4. Saving a setting with a stale `version` → 409 with who saved last; never a silent overwrite. → Task 4 test `saveSetting rejects stale version`.
5. `APP_ENCRYPTION_KEY` missing → `secretsAvailable()` false and `encryptSecret` throws `SecretKeyMissingError`; public pages and non-secret settings unaffected. → Task 3 test.

---

### Task 1: Test infrastructure (vitest unit + integration)

**Files:**

- Create: `vitest.config.ts`, `tests/test-env.mjs`, `tests/stubs/server-only.ts`, `tests/integration/setup/global-setup.ts`, `tests/integration/smoke.test.ts`, `src/server/db/migrate.ts`, `src/lib/smoke.test.ts`
- Modify: `package.json` (scripts + devDeps), `docker-compose.yml` (init script creating `vantage_test`), `tsconfig.json` (include `tests`, vitest types)

**Interfaces:**

- Produces: `yarn test` (all), `yarn test:unit`, `yarn test:integration`; `TEST_DATABASE_URL` (`postgresql://vantage:vantage@localhost:5433/vantage_test`, overridable by `DATABASE_URL_TEST`); `TEST_ENV` object; `runMigrations(url: string): Promise<void>` in `src/server/db/migrate.ts` (drizzle `node-postgres/migrator`, folder `src/server/db/migrations`); integration tests run serially against `vantage_test`, migrated once per run; `assertDisposableDatabase(url)` refuses any DB name not ending in `_test`.

- [ ] **Step 1:** Port MK `vitest.config.ts` (projects `unit` and `integration`, alias `@` → `src`, `server-only` → stub). Unit include `src/**/*.test.{ts,tsx}`; integration include `tests/integration/**/*.test.ts`, `fileParallelism: false`, timeouts 30 000.
- [ ] **Step 2:** Port MK `tests/test-env.mjs` with VANTAGE vars: `NODE_ENV=test`, `DATABASE_URL=TEST_DATABASE_URL`, `AUTH_SECRET` (≥32 chars test value), `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `APP_ENCRYPTION_KEY=BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=`, `MEDIA_DRIVER=local`, `MEDIA_LOCAL_DIR=.test-uploads`, `MEDIA_KEY_PREFIX=vantage`.
- [ ] **Step 3:** Add to `docker-compose.yml` a mounted init SQL creating database `vantage_test` owned by `vantage`; for the already-running container also run `docker compose exec postgres createdb -U vantage vantage_test` (idempotent: ignore "already exists").
- [ ] **Step 4:** Write `src/lib/smoke.test.ts` (`expect(1 + 1).toBe(2)`) and `tests/integration/smoke.test.ts` (connects with `TEST_DATABASE_URL`, `select count(*) from drizzle.__drizzle_migrations` > 0).
- [ ] **Step 5:** Run `yarn test` → Expected: both projects PASS (2 tests).
- [ ] **Step 6:** Commit `test: add vitest unit and integration infrastructure`.

### Task 2: Env schema + VPS build

**Files:**

- Modify: `src/lib/env.ts`, `.env.example`, `next.config.ts`
- Create: `src/lib/env.test.ts`, `Dockerfile`, `.dockerignore`, `docker-compose.yml` service `app` (profile `app`, not started by default)

**Interfaces:**

- Produces: `serverEnv()` additionally returns `MEDIA_DRIVER: 'local' | 's3'` (default `local`), `MEDIA_LOCAL_DIR` (default `.uploads`), `MEDIA_PUBLIC_URL?: string`, `MEDIA_KEY_PREFIX` (default `vantage`, `/^[a-z0-9-]+$/`), `S3_ACCOUNT_ID?`, `S3_ENDPOINT?`, `S3_BUCKET?`, `S3_ACCESS_KEY_ID?`, `S3_SECRET_ACCESS_KEY?`, `APP_ENCRYPTION_KEY?`, `SMTP_HOST?`, `SMTP_PORT?: number`, `SMTP_USER?`, `SMTP_PASS?`, `SMTP_SECURE?: boolean`, `MAIL_FROM?`, `AI_PROVIDER_MOCK?: boolean`, `DISABLE_CUSTOM_SCRIPTS?: boolean`, `SEED_DEMO_USERS?: boolean`. Existing Cloudinary vars stay (removed in phase 5).

- [ ] **Step 1: Write failing tests** in `src/lib/env.test.ts`:
  - `MEDIA_DRIVER=s3` without `S3_BUCKET`/keys → parse throws mentioning `S3_BUCKET`.
  - `MEDIA_DRIVER=s3` with `MEDIA_PUBLIC_URL=http://x` → throws "MEDIA_PUBLIC_URL must be https".
  - minimal env (only current required vars) → `MEDIA_DRIVER === 'local'`, `MEDIA_KEY_PREFIX === 'vantage'`.
  - `MEDIA_KEY_PREFIX='../x'` → throws.
- [ ] **Step 2:** `yarn test:unit src/lib/env.test.ts` → FAIL.
- [ ] **Step 3:** Extend `serverSchema` with the fields above (`superRefine` for the s3 + https rules; booleans via `z.stringbool()` or `'true'` coercion; port, number coercion).
- [ ] **Step 4:** Tests PASS.
- [ ] **Step 5:** `next.config.ts`: `output: 'standalone'`; append to `images.remotePatterns` the host of `process.env.MEDIA_PUBLIC_URL` when set (keep Cloudinary loader/pattern untouched). Add `serverExternalPackages: ['sharp']` if the Next docs require it for standalone.
- [ ] **Step 6:** `Dockerfile`: multi-stage Node 24 alpine (`yarn install --frozen-lockfile`, `yarn build`, copy `.next/standalone`, `.next/static`, `public`), `MEDIA_PUBLIC_URL` as build ARG, runs `node server.js` on 3000. `.dockerignore` excludes `node_modules`, `.next`, `.env*`, `.uploads`, `.test-uploads`.
- [ ] **Step 7:** `.env.example`: add every new var with a one-line comment, empty values.
- [ ] **Step 8:** `yarn build` → succeeds and `.next/standalone/server.js` exists. (Do not run `docker build` unless Docker has spare time; not required.)
- [ ] **Step 9:** Commit `build: extend env schema and add standalone VPS build`.

### Task 3: Crypto + encrypted secrets

**Files:**

- Create: `src/server/lib/crypto.ts`, `src/server/lib/crypto.test.ts`, `src/server/lib/secrets.ts`, `src/server/lib/secrets.test.ts`
- Source: MK `server/lib/crypto.ts`, `server/lib/secrets.ts` (+ tests)

**Interfaces:**

- Produces: `hashIp(ip: string): string`, `derivedHmac(label: string, value: string): string` (crypto; drop MK's unsubscribe/email helpers — no newsletter); `secretsAvailable(): boolean`, `encryptSecret(plain: string, purpose: string): string`, `decryptSecret(payload: string, purpose: string): string | null`, `SecretKeyMissingError`, `SecretKeyInvalidError`, purpose constants `CAPI_TOKEN_PURPOSE = 'tracking.capiToken'`, `AI_KEY_PURPOSE = 'ai.apiKey'`, `SMTP_PASS_PURPOSE = 'smtp.pass'`.

- [ ] **Step 1:** Port MK tests (adapt imports to `@/server/lib/...`, env via `serverEnv()`); add test `encryptSecret throws SecretKeyMissingError when APP_ENCRYPTION_KEY unset` and `decryptSecret with wrong purpose returns null`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Port implementations (AES-256-GCM, purpose as AAD, as MK). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(server): add crypto helpers and purpose-bound secret encryption`.

### Task 4: `settings` + `revisions` storage

**Files:**

- Create: `src/server/db/schema/settings.ts`, `src/server/db/schema/revisions.ts`, `src/server/lib/revisions.ts`, `src/server/lib/conflict.ts`, `src/server/repositories/settings-repository.ts`, `tests/integration/settings.test.ts`, migration via `yarn db:generate`
- Modify: `src/server/db/schema/index.ts`, `src/server/lib/errors.ts`
- Source: MK `server/db/schema/settings.ts`, revisions table in `server/db/schema/pages.ts`, `server/lib/revisions.ts`, `server/lib/conflict.ts`, `server/modules/globals/service.ts`

**Interfaces:**

- Produces:
  - Table `settings` (`key text pk`, `value jsonb not null`, `draft jsonb`, `version integer not null default 1`, `updated_by text` (no FK yet — phase 2 adds it to `users.id`), `updated_at timestamptz`).
  - Table `revisions` as MK (`id uuid`, `entity_type text`, `entity_id text`, `version int`, `snapshot jsonb`, `note text`, `created_by text`, `created_at`), index `(entity_type, entity_id, created_at desc)`.
  - `REVISION_LIMITS = { setting: 20, page: 50 }`; `writeRevision(db, {entityType, entityId, version, snapshot, note?, createdBy?})`, `listRevisions(db, entityType, entityId)`, `findRevision(db, id)` — pruning beyond the limit as MK.
  - `settingsRepository.get(key: string): Promise<{ key; value: unknown; draft: unknown; version: number; updatedBy: string | null; updatedAt: Date } | null>`
  - `settingsRepository.save(key: string, input: { version: number; value: unknown }, actorId: string | null, note?: string): Promise<{ version: number }>` — inserts at version 1 when absent and `input.version === 0`; otherwise conditional `update … where version = input.version`, writes a revision of the **previous** value; zero rows → throws `ApiError('CONFLICT', 'Someone else saved a moment ago', 409)`.
  - `settingsRepository.restore(key, revisionId, actorId): Promise<{ version: number }>`.
  - `ERROR_CODES` gains `PAYLOAD_TOO_LARGE` (413), `UNSUPPORTED_MEDIA_TYPE` (415), `SERVICE_UNAVAILABLE` (503) with static helpers on `ApiError`.
  - Validation of values is **not** here (phase 4 adds per-key zod schemas on top).

- [ ] **Step 1: Failing integration tests** (`tests/integration/settings.test.ts`, truncate tables in `beforeEach`):
  - `save creates key at version 1` → `get('identity').version === 1`.
  - `save increments version and writes revision of previous value` → version 2, `listRevisions('setting','identity')` length 1 with snapshot = first value.
  - `saveSetting rejects stale version` → second save with `version: 1` after it became 2 → rejects with status 409.
  - `prunes revisions beyond 20`.
  - `restore brings back snapshot as a new version`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Schema + `yarn db:generate` (review SQL: two `create table`, one index) + implementations. **Step 4:** PASS (and `yarn db:migrate` against dev DB succeeds).
- [ ] **Step 5:** Commit `feat(server): add versioned settings store with revisions`.

### Task 5: Media processing + R2/local storage library

**Files:**

- Create in `src/server/lib/media/`: `sniff.ts`, `process.ts`, `probe.ts`, `storage.ts`, `read.ts` + each `*.test.ts`; `tests/support/gps-jpeg.ts`
- Modify: `package.json` (`@aws-sdk/client-s3`, `sharp` — MK versions)
- Source: MK `server/lib/media/*` and `tests/support/gps-jpeg.ts`

**Interfaces:**

- Produces:
  - `sniff(bytes: Uint8Array): Sniffed | null` — MK types plus `{ mime: 'video/mp4', ext: 'mp4' }` and `{ mime: 'video/webm', ext: 'webm' }`.
  - `MAX_UPLOAD_BYTES = 20 * 1024 * 1024`, `MAX_VIDEO_BYTES = 100 * 1024 * 1024`.
  - `withProcessingSlot<T>(fn: () => Promise<T>): Promise<T>` — 2 concurrent, queue 8, then throws `ApiError.serviceUnavailable('The server is busy processing uploads — try again in a moment')`.
  - `processUpload(input: Buffer, filename: string, now?: Date): Promise<ProcessedUpload>` — MK behaviour; video inputs skip sharp (`width/height/blurDataUrl/dominantColor` null) and use the video cap.
  - `mediaKeyPattern(prefix: string): RegExp` → `^<prefix>/media/\d{4}/\d{2}/[a-f0-9]{16}-[a-z0-9-]{1,60}\.(jpg|png|webp|avif|pdf|mp4|webm)$`; `buildMediaKey(prefix, now, hash16, slug, ext): string`; `variantKey(key)` as MK.
  - `getStorage(): StorageDriver` (`{ name: 'local' | 's3'; put(key, body, mimeType); urlFor(key) }`), `resetStorageForTests()`, `s3Config(env)` — endpoint `S3_ENDPOINT` if set else `https://${S3_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`, `region: 'auto'`, checksums `WHEN_REQUIRED`, `CacheControl: public, max-age=31536000, immutable`, PDF `attachment` disposition. `put` rejects keys not matching `mediaKeyPattern(MEDIA_KEY_PREFIX)`.
  - Local driver writes under `MEDIA_LOCAL_DIR`, `urlFor(key) = /uploads/${key}`; s3 `urlFor(key) = ${MEDIA_PUBLIC_URL}/${key}`.
  - `readMediaBytes(key)` as MK.

- [ ] **Step 1:** Port every MK media test; change expected keys to `vantage/media/...`; add:
  - `rejects disguised non-image` — `processUpload(Buffer.from('<html>'), 'x.jpg')` rejects with status 415.
  - `rejects image over 20 MB with 413` and `accepts 30 MB mp4 but rejects 101 MB mp4`.
  - `withProcessingSlot rejects when queue full` — start 10 never-resolving jobs, the 11th rejects with 503.
  - `put rejects key outside prefix` — `put('media/2026/01/…')` and `put('other/media/…')` reject.
  - `strips EXIF GPS` (MK test with `gps-jpeg`).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Port/adapt implementations. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(server): add media processing and R2/local storage drivers`.

### Task 6: `media` table, service and admin upload API

**Files:**

- Create: `src/server/db/schema/media.ts`, `src/server/repositories/media-repository.ts`, `src/server/services/media-library-service.ts`, `src/server/api/admin-media.ts`, `src/validations/media-schema.ts`, `tests/integration/media-api.test.ts`, migration via `yarn db:generate`
- Modify: `src/server/db/schema/index.ts`, `src/server/api/index.ts` (mount `.route('/admin/media', adminMedia)`), `.gitignore` (`.uploads`, `.test-uploads`)
- Add: `src/app/uploads/[...key]/route.ts` (serves local-driver files; 404 when `MEDIA_DRIVER=s3`)
- Source: MK `server/db/schema/media.ts`, `server/modules/media/{service,routes}.ts`, `app/uploads/[...key]/route.ts`

**Interfaces:**

- Consumes: Task 5 lib, Task 4 `ApiError` codes, existing `requireAuth` middleware (phase 2 swaps to RBAC `media.*`).
- Produces:
  - Table `media` exactly as MK columns (`id uuid`, `driver`, `key unique`, `url`, `filename`, `mime_type`, `size_bytes`, `width`, `height`, `blur_data_url`, `dominant_color`, `alt`, `caption`, `focal_x real default 0.5`, `focal_y real default 0.5`, `is_decorative bool`, `needs_alt bool`, `created_by text` (no FK yet), timestamps, `deleted_at`); index on `created_at desc` and `mime_type`.
  - `mediaLibraryService.upload(actorId: string | null, file: File): Promise<MediaItem>`, `.list(query: MediaListQuery)`, `.get(id)`, `.update(id, patch: MediaPatch)`, `.replace(actorId, id, file)`, `.remove(id)` (soft delete), `.usageOf(id)` (returns `[]` in this phase; phase 5 fills it).
  - `MediaItem = { id, url, filename, mimeType, sizeBytes, width, height, blurDataUrl, dominantColor, alt, caption, focalX, focalY, isDecorative, needsAlt, createdAt }`.
  - `MediaListQuery` (zod): `page`, `limit≤100`, `type?: 'image' | 'video' | 'pdf'`, `missingAlt?: boolean`, `q?: string`. `MediaPatch`: `alt ≤300`, `caption ≤500`, `focalX/focalY 0..1`, `isDecorative`.
  - Routes (all `requireAuth`, rate-limited 30/min for POST): `GET /api/v1/admin/media`, `GET /:id`, `POST /` (multipart field `file`), `PATCH /:id`, `POST /:id/replace`, `DELETE /:id`.

- [ ] **Step 1: Failing integration tests** (`MEDIA_DRIVER=local`, authenticated via a test helper `tests/support/session.ts` exporting `sessionCookie(user?: Partial<SessionUser>): Promise<string>` built on the existing `createSessionToken` + `SESSION_COOKIE` from `src/server/lib/session.ts`):
  - upload PNG → 201, item `mimeType 'image/png'`, `url` starts `/uploads/vantage/media/`, file exists on disk.
  - upload same bytes twice → second key differs (variant suffix), both rows exist.
  - upload without auth → 401.
  - upload 21 MB PNG → 413; upload `<html>` as `.jpg` → 415.
  - upload mp4 → 201 with `width === null`.
  - `PATCH` alt of 301 chars → 400; valid alt → `needsAlt false`.
  - list `?missingAlt=true` returns only images without alt and not decorative; `DELETE` hides item from list (soft delete).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (schema + migration, repository, service, routes, uploads route). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(server): add media library table, service and admin upload API`.

### Task 7: SMTP mailer with no-SMTP mode

**Files:**

- Create: `src/server/lib/email/mailer.ts`, `src/server/lib/email/mailer.test.ts`, `src/server/lib/email/layout.ts` (MK-style plain HTML wrapper + text fallback)
- Modify: `package.json` (`nodemailer`, `@types/nodemailer`)
- Source (templates/layout only): MK `server/lib/email/*`

**Interfaces:**

- Produces:
  - `smtpConfigured(): boolean` — true only when `SMTP_HOST` and `MAIL_FROM` are set.
  - `sendMail(msg: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string }): Promise<{ delivered: true; messageId: string } | { delivered: false; reason: 'smtp_not_configured' | 'send_failed'; error?: string }>` — never throws; logs failures without credentials.
  - `verifySmtp(): Promise<{ ok: boolean; error?: string }>` (for the phase-4 Test button).
  - `renderEmail({ heading: string; paragraphs: string[]; cta?: { label: string; url: string } }): { html: string; text: string }`.
  - `resetMailerForTests(transport?: Transporter)`.

- [ ] **Step 1: Failing tests:** no SMTP env → `sendMail` resolves `{ delivered: false, reason: 'smtp_not_configured' }` and `smtpConfigured() === false`; with injected `nodemailer` `jsonTransport` → `delivered: true`; transport that throws → `{ delivered: false, reason: 'send_failed' }`; `renderEmail` escapes HTML in paragraphs.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(server): add SMTP mailer that degrades without SMTP`.

### Task 8: Wire real R2 credentials + smoke check

**Files:**

- Modify: `.env.local` (not committed)
- Create: `scripts/r2-smoke.ts`, `package.json` script `"media:smoke": "tsx scripts/r2-smoke.ts"`

**Interfaces:**

- Consumes: Task 5 `getStorage()`.

- [ ] **Step 1:** Copy `S3_ACCOUNT_ID, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, MEDIA_PUBLIC_URL` from `/Users/nazmulhasansourab/ireland/james-whitfield/.env` into VANTAGE `.env.local` (owner approved), plus `MEDIA_KEY_PREFIX=vantage`, `MEDIA_DRIVER=local` (keep local in dev until phase 5), and a newly generated `APP_ENCRYPTION_KEY` (`openssl rand -base64 32`). Do not echo values.
- [ ] **Step 2:** `scripts/r2-smoke.ts` forces the s3 driver, uploads a 1×1 PNG processed by `processUpload` under `vantage/media/...`, then `fetch(urlFor(key))` → expects 200 and `content-type image/png`; prints only the key and status.
- [ ] **Step 3:** `yarn media:smoke` → Expected: `OK vantage/media/YYYY/MM/<hash>-r2-smoke.png 200`.
- [ ] **Step 4:** Commit only `scripts/r2-smoke.ts` and `package.json`: `chore: add R2 smoke check script`.

### Phase exit check

- [ ] `yarn tsc --noEmit` (ignore pre-existing `LayoutProps` generated-type errors), `yarn lint` (0 errors), `yarn test` all green.
- [ ] Public site and current admin still work: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → 200; `/dashboard` redirects to login when logged out.
