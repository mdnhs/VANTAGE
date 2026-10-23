# Admin MK Parity — Phase 4: Settings + GlobalEditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace VANTAGE's 90-column `site_settings` singleton and its 13 ad-hoc PATCH forms with MK's versioned key/value globals: zod schema per key, schema-driven forms, GlobalEditor with Save + History/restore + 409 conflict handling, `/dashboard/settings/[slug]` pages (Identity, Contact, Navigation, Footer, Forms & microcopy, Notifications, Privacy), website page editors on the same model, per-key cache tags, and MK's notification / auto-reply / retention behaviour — with the public site reading the new keys and looking identical.

**Architecture:** Port MK (`/Users/nazmulhasansourab/ireland/james-whitfield`) `lib/content/{globals,global-access}.ts`, `server/modules/globals/*`, `admin/modules/globals/*`, `admin/components/schema-form/*`, `server/modules/leads/notify.ts` into VANTAGE (`src/lib/content/*`, `src/server/services/globals-service.ts`, `src/server/api/admin-globals.ts`, `src/features/globals/*`, `src/components/admin/schema-form/*`). Storage is Phase 1's `settings`/`revisions` tables; audit is Phase 2's `audit()`. A one-off script copies `site_settings` into keys; `site_settings` stays read-only until Phase 11.

**Tech Stack:** zod v4 (`z.registry`, `z.toJSONSchema`), react-hook-form + zodResolver, react-query, Hono, Drizzle, Next 16 `'use cache'` + `cacheTag`, sonner.

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§2 goals 4–5 partial, §5.6) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md`

## Global Constraints

- Branch `feat/admin-mk-parity`; tasks run in git worktrees per the Phase 3 setup (own test DB `vantage_<slot>_test`), stage only named files.
- Editing model exactly MK: explicit "Save {label}" per form, PageHeader "Changes go live as soon as you save.", `{version, value}` PUT, 409 → refetch + formError "Someone else saved this a moment ago. Their version is loaded; make your change again.", History sheet (Version N · who · when · Restore), restore re-validates and saves as a new version with note "Restored version N".
- Revision semantics = MK: after each save write a revision holding the **new** value and **new** version (change Phase 1 `settingsRepository.save`; update its tests).
- Keys and access (read / update):
  | Key                                                                                                                                              | Read          | Update          | Settings page                                                |
  | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | --------------- | ------------------------------------------------------------ |
  | `site` (name, legalName, logo, favicon, lottie logo, social[])                                                                                   | settings.read | settings.update | identity                                                     |
  | `contact` (email, phone {display,e164}, emergencyPhone, whatsapp, address {lines[],city,eircode,country}, hours {weekly[],summary,note}, mapUrl) | globals.read  | globals.update  | contact                                                      |
  | `navigation` (links[] ≤7, cta)                                                                                                                   | globals.read  | globals.update  | navigation                                                   |
  | `footer` (blurb, columns[] ≤4, contactNote, legalLinks[] ≤6, copyrightName)                                                                      | globals.read  | globals.update  | footer                                                       |
  | `quoteForm`, `contactForm`, `microcopy`                                                                                                          | globals.read  | globals.update  | forms (tabs)                                                 |
  | `notifications` (recipients[] ≤10, includeMessage, autoReply {enabled,subject,body})                                                             | settings.read | settings.update | notifications                                                |
  | `privacy` (enquiryRetentionMonths 1–120 default 24, spamRetentionDays 1–365 default 30)                                                          | settings.read | settings.update | privacy                                                      |
  | `seo` (titleTemplate with `%s`, defaultTitle, defaultDescription, defaultOgImage, twitterHandle, robots)                                         | seo.read      | seo.update      | (edited in Phase 6 SEO › Defaults; key + migration land now) |
  | `page.home`, `page.services`, `page.our-work`, `page.insurance`, `page.about`, `page.process`                                                    | page.read     | page.update     | website editors                                              |
- Image fields use `ImageRef = { kind: 'cloudinary', publicId: string } | { kind: 'media', id: uuid } | null` (Phase 5 converts all to `media`); widget uses the existing `CloudinaryUpload` now. Hero video same with `VideoRef`.
- Defaults: every schema field defaults to today's public copy (`FALLBACK_SETTINGS`, `resolve*Content` defaults) so `parseGlobal(key, {})` renders the current site.
- Public site must look identical before/after (same text, images, nav, footer).
- Cache: `'use cache'` + `cacheTag('settings:<key>')` + `cacheLife('max')` for public reads; save/restore invalidate that tag only.
- Email (notifications/auto-reply) via `sendMail`; when SMTP is not configured nothing is sent and nothing throws. Auto-reply never includes the enquiry message body.

## Review Focus

1. Two admins edit the same settings page; the second save → 409 with the friendly message and the other person's version loaded, never a silent overwrite. → Task 1 + Task 4 tests.
2. A role without update permission opens a settings page → form disabled (read-only), save endpoint 403; a role without read → no-access page. → Task 1 + Task 4 tests.
3. A public page after migration renders exactly the same strings/images as before (homepage hero, about team, insurance steps, footer address/hours). → Task 2 snapshot tests on resolved props.
4. Malformed stored value (drift) never crashes the public site: `parseGlobal` falls back to defaults and logs. → Task 1 test.
5. A new quote with SMTP missing still saves and returns success; with SMTP present recipients get the notification and the customer gets the auto-reply (if enabled) without the message body unless `includeMessage`. → Task 6 tests.

---

### Task 1: Globals core (schemas, access, service, API, public reads)

**Files:** Create `src/lib/content/{globals,global-access,image-ref}.ts` (+ tests), `src/server/services/globals-service.ts`, `src/server/api/admin-globals.ts` (mount `/admin/globals`), `src/server/lib/cache/settings-tags.ts`, `src/server/queries/get-setting.ts` (`'use cache'`), `src/lib/audit/top-level-diff.ts`; Modify `src/server/repositories/settings-repository.ts` (MK revision semantics), `src/server/lib/conflict.ts` (carry `{version, updatedAt, updatedBy}` like MK `conflictError`).
**Interfaces:** `GLOBALS`, `GlobalKey`, `GlobalValue<K>`, `PUBLIC_GLOBAL_KEYS` (all except notifications, privacy), `parseGlobal(key, value)`, `EDITABLE_GLOBAL_KEYS`, `GLOBAL_ACCESS`, `SETTINGS_PAGES` (identity→[site], contact→[contact], navigation→[navigation], footer→[footer], forms→[quoteForm, contactForm, microcopy], notifications→[notifications], privacy→[privacy]), `SETTINGS_PAGE_LABELS`, `GLOBAL_LABELS`; `getGlobal(key)`, `saveGlobal(actor, key, {version, value}, note?)`, `globalRevisions(key)`, `restoreGlobal(actor, key, revisionId, {version})`; routes `GET /:key`, `PUT /:key`, `GET /:key/revisions`, `POST /:key/revisions/:rev/restore` with `canGlobal(mode)`; `getSetting(key)` cached public reader.

- [ ] Tests: per-key read/update permission matrix over roles; stale version → 409 with updatedBy; invalid value → 422 field errors; revision holds new value; restore creates version+1 and re-validates; audit row with top-level diff; drift → defaults; unknown key → 404.
- [ ] RED → implement → GREEN → commit `feat(settings): add versioned globals core`.

### Task 2: Migrate site_settings into keys; public site reads keys

**Files:** Create `scripts/migrate-site-settings.ts` (`yarn settings:migrate [--dry-run|--verify]`), `src/server/lib/settings/site-settings-migration.ts` (+ integration test); Modify `src/server/services/site-settings-service.ts` (`getPublic()` becomes an adapter composing `getSetting` keys into the existing `PublicSiteSettings` shape so marketing components keep working), `src/features/{about,insurance,process}-page/defaults.ts` (read from `page.*` values), `src/app/layout.tsx`, `src/app/(marketing)/**` readers as needed.

- Mapping per the Global Constraints table; `openingHours` JSON → `contact.hours.weekly`; legacy free-text hours → `hours.summary`; socials → `site.social[]`; Cloudinary ids → `ImageRef{kind:'cloudinary'}`; insurance/about JSONB lists → arrays in `page.*`. Idempotent (insert only missing keys at version 1 unless `--force`), dry-run prints key list + field counts, verify re-resolves `getPublic()` from keys and deep-compares with the legacy row.
- [ ] Tests: fixture `site_settings` row → migrate → adapter output deep-equals legacy `getPublic()` (Review Focus 3); empty DB → defaults equal `FALLBACK_SETTINGS`; re-run no-op. Run dry-run/real/verify on dev.
- [ ] Commit `feat(settings): migrate site settings into versioned keys`.

### Task 3: Schema-form engine

**Files:** Create `src/components/admin/schema-form/{registry,field-ui,to-fields,schema-form,widgets,widgets/*}.tsx|ts` (+ `to-fields.test.ts`); port MK widgets text, textarea, number, toggle, select, radio, list (add/remove/reorder), group, link, image (wrapping `CloudinaryUpload`, emits `ImageRef`), video, weekly-hours.

- [ ] Tests: `toFields` infers widgets as MK (enum→select, boolean→toggle, number, object→group, array→list, long string→textarea, nullable unwrap); overrides by dotted path with `$`; `emptyValueFor`.
- [ ] Commit `feat(admin): add schema-driven form engine`.

### Task 4: GlobalEditor, History, settings pages

**Files:** Create `src/features/globals/{components/{global-editor,global-form,global-history},global-ui.ts,hooks,services}`, `dashboard/settings/[slug]/page.tsx`, `dashboard/settings/page.tsx` (redirect to first visible child); Modify `src/lib/admin/nav.ts` (settings children identity…privacy with MK permissions), `src/lib/admin/route-permissions.ts`; Delete `src/features/site-settings/components/settings-tabs.tsx` + section forms once replaced.

- [ ] Tests: two clients save same key → second gets conflict UI path (service-level 409 + hook maps to formError); viewer sees disabled fieldset (UI-only) and 403 on PUT; History lists versions newest first and restore works.
- [ ] Commit `feat(settings): add global editor and settings pages`.

### Task 5: Website page editors on GlobalEditor

**Files:** Modify `dashboard/(site)/{home-page,services,projects,insurance,about,process-page}` pages to render `GlobalEditor` for `page.*` keys (inside existing `PageTabs` where lists also live), Delete old hero/page forms + 13 PATCH hooks + `src/server/api/site-settings.ts` PATCH routes + `update*Schema`s; keep `GET /site-settings` public adapter.

- [ ] Tests: grep-level test that no client code references deleted endpoints; integration: page.update role saves `page.home` and the public adapter reflects it.
- [ ] Commit `feat(admin): move website page copy to global editors`.

### Task 6: Notifications, auto-reply, retention; navigation/footer/forms wired

**Files:** Create `src/server/services/enquiry-notify.ts` (MK notify: recipients from `notifications` or fallback `contact.email`, includeMessage, autoReply; renderEmail), `src/server/services/retention-service.ts` + `scripts/retention.ts` (`yarn jobs:retention`, purges quotes/contacts older than `enquiryRetentionMonths` and status cancelled/archived spam older than `spamRetentionDays`; dry-run flag), Notifications page "Send test email" (`POST /admin/globals/notifications/test` → `verifySmtp` + test mail; shows "SMTP not configured"); Modify quote/contact create services to call notify after commit (fire-and-forget, errors logged), marketing header/footer/forms to read `navigation`, `footer`, `quoteForm`, `contactForm`, `microcopy` via `getSetting` with defaults equal to current hard-coded copy; docs `docs/setup/cron.md` (VPS crontab line).

- [ ] Tests: notify with SMTP missing → no throw, quote saved (Review Focus 5); with injected transport → recipients mail + auto-reply without body; retention dry-run counts; public header renders nav links from defaults identical to current.
- [ ] Commit `feat(settings): add enquiry notifications, retention and editable site chrome`.

### Phase exit check

- [ ] `yarn tsc --noEmit`, `yarn lint` 0 errors, `yarn test` green, `yarn build` OK; `yarn settings:migrate --verify` OK on dev.
- [ ] Controller browser check: every settings page + website editor saves; history restore; viewer read-only; public site visually unchanged (home, services, our-work, insurance, about, process, contact, footer).
