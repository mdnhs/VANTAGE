# Admin MK Parity — Phase 11: Final Parity Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every item parked for Phase 11 across Phases 1–10 and the remaining MK-vs-VANTAGE admin gaps (spam model, dashboard, enquiry export and privacy requests, author ownership, per-page share card, media and SEO hardening, mobile layout), then retire the Cloudinary/legacy-settings read paths in two gated stages, without losing any VANTAGE core feature.

**Architecture:** Same layering as Phases 1–10 (Hono `/api/v1` → services → repositories; features under `src/features/*`; pure libs under `src/lib/*`). One Phase 11 migration (`0028`) adds the few columns the new behaviour needs. Legacy removal is split: **Stage A** (merged on `feat/admin-mk-parity`) removes every app read of `*_public_id`, the Cloudinary URL fallback, `res.cloudinary.com`, the `site_settings` fallback and `withLegacyMeta`, and ships `yarn legacy:check` as its production gate; **Stage B** (branch `chore/p11-drop-legacy`, **not merged** by this phase) drops the columns/tables with a self-guarding migration that the owner runs from the runbook.

**Tech Stack:** Next 16.3 (`cacheComponents`, `'use cache'`, `cacheTag`/`cacheLife`, `revalidateTag`, `draftMode`, route handlers + `generateStaticParams`, `next/og` `ImageResponse`, `proxy.ts`), Hono, Drizzle + pg, zod v4, react-query, nuqs, base-ui shadcn, sonner, vitest (unit + integration, happy-dom), `undici@7.29.1` (new direct dep, Controller call 8).

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§1 hard rule, §2 goals 1–13, §4 anti-goals, §5.3 RBAC, §5.6a cutover, §6) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md` (Phase 11, depends on all) · **Ledgers read:** `.superpowers/sdd/2026-10-22-admin-mk-parity-phase-{1..10}-*/{progress,final-review,final-findings,final-fix-report}.md`, `.superpowers/sdd/parallel-waves.md` · **Worktree rules:** `.superpowers/sdd/manual-worktree-setup.md` · **Format model:** phase-6-seo plan. Read before writing Next code: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` (§ Static Generation with `generateStaticParams`), `.../04-functions/{generate-static-params,draft-mode,revalidateTag}.md`, `.../01-directives/use-cache.md`, `.../03-file-conventions/proxy.md`, `.../05-config/01-next-config-js/output.md` (`outputFileTracingIncludes`).

## Global Constraints

- **Base:** `feat/admin-mk-parity` **after** the Phase 6 final fix wave (`wt/p6f`: I1 runbook, M1, M4, M5, M8, M9) has merged. Nothing here repeats those items.
- **Worktrees:** each task runs in a controller-made manual worktree `.claude/worktrees/p11-<N>` on branch `wt/p11-<N>`, test DB `vantage_p11_<N>_test`, dev port `31<NN>` (Task 3 → `3103`, Task 14 → `3114`). Follow `.superpowers/sdd/manual-worktree-setup.md` to the letter. `git add <named paths>` only, never `-A`; never stage `AGENTS.md` or `.env*`.
- **Hard rule: never remove a VANTAGE core feature.** Quote inbox + kanban (dnd-kit) with every field, manual "New enquiry", contact inbox + notes, dashboard KPIs + 6-month chart + channel breakdown + recent leads (for roles that may read quotes), home tabs with reorder/enable, services/projects CRUD + reorder + publish/featured + before/after + gallery, insurance/about/process forms, users. Each task's last step re-checks the screens it touched.
- **Public pages stay `○`:** `/`, `/services`, `/our-work`, `/insurance`, `/about`, `/process`, `/contact`, `/get-a-quote`, `/robots.txt`, `/sitemap.xml`, `/og` stay `○` in `yarn build`; the new `/og/[page]` is prerendered per id (`●`). Public code reads only `'use cache'` functions; client-side fetches (form stamp) are fine.
- **Every admin write:** `can(...)` → `notViewingAs(VIEW_AS_READ_ONLY)` (from `src/server/middleware/view-as.ts`) → audit (route `auditRoute` or `audit()` in the service tx). The static scan `src/server/middleware/audit-route.test.ts` must stay green for every new route file. Exports (GET) are audited like `audit.export`.
- **Migrations:** exactly one on `feat` — Task 1, `0028_<drizzle-generated>.sql` (latest today `0027_solid_demogoblin.sql`); generate after rebasing on the tip; controller renumbers on conflict. Stage B's `0029_drop_legacy.sql` lives **only** on `chore/p11-drop-legacy` (Task 21). No other task touches `src/server/db/schema/*` or `migrations/*`.
- **Destructive data changes:** no task deletes or drops data automatically. Stage A only stops reading; Stage B is merged and run by the owner per `docs/setup/production-cutover-phase-11.md`.
- **Copy:** MK copy verbatim where MK has it (quoted per task). Irish time (`Europe/Dublin`, `en-IE`) for every date.
- **Exit gates per task:** `yarn tsc --noEmit`, `yarn lint` (0 errors), the task's tests, and the full `yarn test` on the task's own test DB before reporting DONE.

## Shared files (controller sequences merges)

| File | Tasks | Edit |
| --- | --- | --- |
| `src/server/db/schema/*`, `migrations/*` | 1 (feat), 21 (branch) | T1: 3 columns + `media_object_purges`; T21: drops |
| `src/server/api/index.ts`, `src/lib/routes/api-routes.ts` | 9, 13 | T9 `.route('/public/enquiry-stamp', publicStamp)`, `API_ROUTES.enquiryStamp`; T13 `.route('/admin/enquiries', adminEnquiries)`, `API_ROUTES.enquiries.{exportCsv,privacy}` |
| `src/server/services/retention-service.ts` | 9 | billing guard on spam purge; `SPAM_STATUS` re-export |
| `scripts/retention.ts`, `docs/setup/cron.md` | 11 | media purge after `runRetention` |
| `src/server/lib/settings/public-settings.ts` | 6 → 16 → 19 | W1 derive defaults; W3 `phoneHref`; W4 drop legacy |
| `src/server/queries/get-page-seo.ts` | 2 → 19 | W1 sitemap `lastModified`; W4 legacy meta/image removal (T18 must not touch it) |
| `src/lib/seo/metadata.ts` (+test) | 3 | per-page generated card path |
| `next.config.ts` | 3 → 18 | W1 `outputFileTracingIncludes`; W4 drop `res.cloudinary.com` |
| `src/components/marketing/stitch-estimator.tsx` | 5 → 9 | W1 error text token; W2 honeypot + stamp |
| `src/components/marketing/{stitch-header,footer,contact-info,stitch-cta}.tsx` | 16 | tel/wa links only |
| `src/features/quote-requests/components/inbox/quote-inbox-view.tsx`, `contact-inbox-view.tsx` | 13 → 14 | W2 one `<EnquiryActions>` in header actions; W3 Spam tab |
| `src/features/{quote-requests,contact-messages}/components/*-status-badge.tsx` | 9 → 14 | W2 add `spam` label only; W3 StatusPill |
| `src/server/services/{service,project,testimonial,partner-logo,homepage-catalog}-service.ts` | 10 → 15 → 18 | W2 author guard; W3 media tx; W4 legacy removal |
| `src/features/projects/components/{list/project-table,project-form}.tsx` | 10 → 17 → 18 | W2 author gating; W3 StatusPill/EmptyState; W4 legacy notice removal |
| `src/server/services/globals-service.ts` | 15 → 19 | W3 re-assert in tx; W4 drop legacy `getGlobal` fallback |
| `src/server/services/ai/tool-data.ts` | 9 | stats exclude spam |
| `package.json`, `yarn.lock` | 4, 8 | T4 `undici@7.29.1`; T8 `legacy:check` script |
| `src/features/globals/global-ui.ts` | 9 | `spamRetentionDays` description |

## Concurrency

- **Wave 1 (parallel):** T1 schema · T2 redirects/sitemap · T3 OG card · T4 SSRF guard · T5 appearance polish · T6 default copy · T7 test hygiene · T8 legacy check + runbook. Disjoint files (T5 owns `stitch-estimator.tsx` this wave).
- **Wave 2 (after T1 merges):** T9 spam server · T10 author ownership · T11 media purge + upload admission · T12 dashboard · T13 export + privacy request. Shared: `api/index.ts`/`api-routes.ts` (T9, T13 — one line each).
- **Wave 3:** T14 spam + enquiry list UI (needs 9, 13) · T15 media save/delete race (needs 10) · T16 tel links + Lottie check (needs 6) · T17 list visual parity (needs 10).
- **Wave 4 (Stage A):** controller first tags the feat tip `p11-pre-legacy-removal` (Controller call 16). T18 content media legacy · T19 settings legacy. Shared: none (T19 owns `get-page-seo.ts`).
- **Wave 5:** T20 mobile 390px pass (feat) ‖ T21 Stage B branch (from feat after T19; never merged here).
- Then phase final review (opus) → fix wave → **Phase exit check**.

## Controller calls (my decisions)

1. **Spam = MK model minus Turnstile.** Hidden honeypot `website` + signed form stamp (min 3 s, max 7 days, MK `stamp.ts`), fetched by the form from `GET /api/v1/public/enquiry-stamp` on mount (pages stay static). A submission that passes the zod schema but trips either check is stored with `status 'spam'` + `spam_reason`, sends no email, no CAPI, stores no photos, answers exactly like a real one. Invalid bodies still 422 (VANTAGE validates first; MK stores raw). "Not spam" moves to `new`, clears the reason, sends nothing late.
2. **Spam never eats financial records:** "Mark as spam" on a quote with invoice/payment data → 422; the spam purge also requires no billing data (6-year accounting rule from the Phase 4 ruling).
3. **Author = own draft projects only** (spec §5.3 "own projects" + MK own-drafts rule): create forces `draft`/not featured; update only own rows still in `draft`; never status/featured/order; no other content type. Existing projects (`created_by` null) are read-only for authors. `matrix.ts` already labels these cells `own` — now enforced.
4. **Dashboard:** MK cards for everyone by permission (greeting, View site, New enquiries KPI, SEO health KPI, Enquiries this week, Next up, Team activity, Content health). VANTAGE's pipeline block (6 KPIs incl. revenue, 6-month chart, channels, recent leads with names) renders **only for `quote.read`**; today every role with `dashboard.view` receives those rows — a §5.3 leak (marketer "no leads").
5. **Privacy request** = MK DSAR (export JSON / erase by email) for quotes + contacts only: no newsletter (none), no AI erase (Phase 9 ruling V9-R11). Erase keeps quotes with billing data and reports them.
6. **CSV export** for quotes and contacts (the `quote.export`/`contact.export` grants exist but have no UI today), rate-limited 10/min, audited.
7. **No lead timeline** (MK `lead_activities`): VANTAGE keeps its notes field + Activity log.
8. **SSRF:** DNS-rebinding guard = `undici` `Agent({ connect: { lookup } })` refusing private/loopback/link-local/CGNAT/ULA/mapped addresses at connect time, used for the openai-compatible provider and its model list. `undici@7.29.1` is already in the lockfile as a transitive dep; it becomes a pinned direct dep (spec §6 dep list deviation, reported).
9. **Per-page share card:** `/og/[page]` for the 8 public page ids, prerendered via `generateStaticParams` (`dynamicParams = false`) + `'use cache'` tagged `site`, `theme`, `seo`, `seo.page.<id>`. Title = page `ogTitle` → page SEO title → registry title (home: → site name); eyebrow = `PUBLIC_PAGES.home.title`; site name; colours = `#131313` background, `#ffffff` text, published brand colour accent; font = MK's `assets/fonts/Inter-Regular.ttf` (+ `OFL-Inter.txt`), traced via `outputFileTracingIncludes`. `/og` (site card) stays for the root metadata.
10. **Redirect hardening:** proxy redirect responses carry `Cache-Control: public, max-age=3600` (a turned-off 301 clears within an hour); dialog hint "Browsers remember a permanent redirect for up to an hour. Use 302 while testing." Hits count only when the proxy's HMAC header (`AUTH_SECRET`, label `redirect-hit`) verifies, never for `HEAD` or prefetch.
11. **Sitemap `lastModified`** per page = latest `updated_at` of its `page.*` and `seo.page.*` settings rows (`services` also `services`, `our-work` also `projects`); omitted when nothing is stored.
12. **Media purge:** replaced and soft-deleted library objects are queued in `media_object_purges` with `due_at = now + 30 days` and deleted from storage by `yarn jobs:retention`; the soft-deleted `media` row stays (library rows are never hard-deleted).
13. **Upload admission:** `parseBody()` + processing run inside a 2-running / 8-queued gate; overflow → 503 "The server is busy. Try again in a moment." before the body is buffered.
14. **Contrast:** estimator error text → `text-brand-soft` (9.79:1); new check `['brand-mid','surface',4.5]`. The 12px eyebrows keep brand-on-`#131313` (3.85:1): Figma colour, pixel-identical default rule; flagged to the owner in the runbook.
15. **Draft cookie:** leaving Appearance calls `/api/v1/preview/exit` (keepalive) unless "Preview on site" was opened during that visit. Admin light/dark draft mode previews live on Appearance.
16. **Legacy removal gate:** before the first Stage A merge the controller tags the feat tip `p11-pre-legacy-removal` (last build with fallbacks). Production rule: a build containing Stage A may take traffic only after `yarn legacy:check` prints `OK` against the production DB (run after `auth:migrate-admins`, `settings:migrate`, `media:migrate` and their `--verify`). Until then the owner deploys the tag.
17. **Stage B scope** (owner's go only): drop `*_public_id` (services ×2, projects ×2, project_gallery_images, partner_logos, homepage_catalogs, testimonials), `quote_requests.photo_urls`, `contact_messages.photo_urls`, `quote_requests.assigned_admin_id`, tables `admin_users` and `site_settings`; delete the one-off migration CLIs/libs; remove `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. The migration first `RAISE`s if any legacy-only data remains, and runs **after** the Stage B code is live.
18. **Mobile pass** covers the admin at 390×844 plus the public consent banner and preview bar; public page layouts are otherwise untouched.

## Review Focus

1. **A real customer lands in Spam** (stamp fetch failed, JS slow, fast autofill <3 s) → it is kept, visible under the Spam tab with its reason, one click "Not spam" returns it to the inbox and the bell; never deleted before `spamRetentionDays`. → Task 9 tests (`too-fast`, missing stamp, restore), Task 14 UI test.
2. **Customer data reaching roles without lead access** (dashboard pipeline/recent leads, export, privacy request, AI stats) → marketer/editor/author/viewer get no names, emails, phones or money figures in any payload. → Task 12, 13 tests.
3. **Erasing or spamming financial records** → a paid/invoiced quote is never deleted by privacy erase, spam marking or spam purge. → Task 9, 13 tests.
4. **Stage A deployed before the migrations ran** → `yarn legacy:check` exits 1 naming every unmigrated row class; runbook forbids traffic until `OK`; the Stage B migration refuses to drop while any legacy-only row exists. → Task 8, 21 tests.
5. **Author reaching others' content** (API calls bypassing the hidden buttons: update another author's project, publish own draft, reorder, edit a service) → 403 with the plan's message, no row changed, no audit row. → Task 10 tests.

---

### Task 1: Phase 11 schema (migration 0028) and billing predicate

**Files:** Create `src/server/db/schema/media-purges.ts`, `src/server/lib/enquiries/billing.ts` (+ `billing.test.ts`), migration `0028_*.sql` (generated); Modify `src/server/db/schema/{quote-requests,contact-messages,projects,index}.ts`, `tests/integration/setup/*` truncate list if it enumerates tables.
**Interfaces (Produces):**
- `quoteRequests.spamReason` / `contactMessages.spamReason`: `varchar('spam_reason', { length: 40 })` nullable.
- `projects.createdBy`: `text('created_by').references(() => users.id, { onDelete: 'set null' })` + index `projects_created_by_idx`.
- `mediaObjectPurges` table `media_object_purges`: `key text primary key`, `reason varchar(16) not null` check `in ('replaced','deleted')`, `due_at timestamptz not null`, `created_at timestamptz not null default now()`, index on `due_at`. Exports `MEDIA_PURGE_REASONS = ['replaced','deleted'] as const`, `MediaPurgeReason`, `MediaObjectPurge`.
- `billing.ts`: `noBillingData(): SQL` (exactly retention's four conditions: `invoice_number is null`, `payment_status = 'unpaid'`, `paid_amount` null or `0`, `payment_method is null`) and `hasBillingData(row: Pick<QuoteRequest,'invoiceNumber'|'paymentStatus'|'paidAmount'|'paymentMethod'>): boolean` (its JS mirror).

- [ ] **Step 1: Failing tests** — `billing.test.ts`: `hasBillingData` false for `{null,'unpaid','0.00',null}` and `{null,'unpaid',null,null}`; true for each single filled field (`'INV-1'`, `'paid'`, `'10.00'`, `'card'`).
- [ ] **Step 2:** `yarn vitest run --project unit src/server/lib/enquiries` → FAIL.
- [ ] **Step 3:** Edit schema, `yarn db:generate` (inspect: only the 3 columns, 1 index, 1 table, 1 check), `yarn db:migrate` on the slot DB; implement `billing.ts`.
- [ ] **Step 4:** PASS; `yarn test` full (integration global-setup applies 0028 on a fresh DB); `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(db): add spam reason, project owner and media purge queue`.

### Task 2: Redirect caching, hit-count token, per-page sitemap dates (P6 M2, M3, M7)

**Files:** Create `src/lib/seo/hit-token.ts` (+ test); Modify `src/proxy.ts` (+ `proxy.test.ts`), `src/server/api/resolve.ts`, `tests/integration/resolve-api.test.ts`, `src/features/seo/components/redirect-dialog.tsx`, `src/server/queries/get-page-seo.ts` (`getSitemapEntries` only), `src/app/sitemap.ts`, `tests/integration/page-seo.test.ts`.
**Interfaces:**
- `hit-token.ts` (pure, `node:crypto` only, proxy-safe): `HIT_HEADER = 'x-vantage-hit'`, `hitToken(secret: string, path: string): string` (HMAC-SHA256 of `redirect-hit:${path}`, hex, 32 chars), `isHitToken(secret: string, path: string, token: string | null | undefined): boolean` (`timingSafeEqual`, length-checked).
- `proxy.ts`: `REDIRECT_CACHE_CONTROL = 'public, max-age=3600'` set on every redirect it returns; `isPrefetch(request: NextRequest): boolean` (`next-router-prefetch` header, `purpose: prefetch`, or `sec-purpose` containing `prefetch`); the resolver fetch sends `HIT_HEADER: hitToken(process.env.AUTH_SECRET ?? '', pathname)` only for `GET` and `!isPrefetch`.
- `resolve.ts`: `recordHit` runs only when `isHitToken(serverEnv().AUTH_SECRET, path, header)`.
- `SitemapEntry` gains `lastModified?: Date`; `getSitemapEntries` adds tags `CACHE_TAGS.all('services')`, `CACHE_TAGS.all('projects')` and each `settingTag(page.pageKey)`.
- Dialog hint under Status (exact copy, Controller call 10).

- [ ] **Step 1: Failing tests**
  - `hit-token.test.ts`: same inputs → same token; other path or secret → `isHitToken` false; `null`/`''`/wrong length → false.
  - `proxy.test.ts` (keep all cases): redirect response has `cache-control: public, max-age=3600`; resolver fetch for `GET /old` carries `x-vantage-hit` equal to `hitToken(secret,'/old')`; `HEAD /old` and `GET /old` with `next-router-prefetch: 1` or `sec-purpose: prefetch` send no header.
  - `resolve-api.test.ts`: no header → redirect answered, `hit_count` stays 0; wrong token → 0; valid token → 1.
  - `page-seo.test.ts`: saving `page.about` then `getSitemapEntries()` → `/about` `lastModified` equals that row's `updated_at`; a page with no stored rows has no `lastModified`; a service update moves `/services`' date.
- [ ] **Step 2:** `yarn vitest run --project unit src/lib/seo/hit-token.test.ts src/proxy.test.ts && yarn vitest run --project integration tests/integration/resolve-api.test.ts tests/integration/page-seo.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `yarn build` keeps `/sitemap.xml` `○`; `tsc`, `lint`.
- [ ] **Step 5:** Commit `fix(seo): cache-limit redirects, sign hit counts and date sitemap entries`.

### Task 3: Branded per-page share card `/og/[page]` (MK parity)

**Files:** Create `assets/fonts/Inter-Regular.ttf`, `assets/fonts/OFL-Inter.txt` (copied from MK `assets/fonts/`), `src/lib/seo/og-card.tsx` (+ `og-card.test.tsx`), `src/server/lib/seo/og.tsx`, `src/app/og/[page]/route.tsx`; Modify `src/lib/seo/metadata.ts` (+ test), `next.config.ts` (`outputFileTracingIncludes: { '/og/\\[page\\]': ['./assets/fonts/*.ttf'] }`), the SEO tab social card (`src/features/seo/components/social-card.tsx`, `<img src>` → per-page path).
**Interfaces:**
- Consumes: `PUBLIC_PAGES`, `PUBLIC_PAGE_IDS`, `PublicPageId` (`src/lib/seo/public-pages.ts`), `getSetting`, `seoPageKey`, `blank`, `OG_SIZE`, the published site theme reader used by `getSiteThemeForRender`.
- Produces: `og-card.tsx` (port of MK `lib/seo/og-card.tsx`, no server imports) `OgSubject = { title: string; eyebrow: string; siteName: string }`, `OgColors = { background: string; text: string; accent: string }`, `OgCard(props)`; `og.tsx` (`server-only`): `ogSubjectFor(id: PublicPageId): Promise<OgSubject>` (`'use cache'`, tags per Controller call 9), `ogColors(): Promise<OgColors>`, `renderOg(subject, colors): Promise<ImageResponse>` (fonts read once per process, name `Inter`, weight 400); route `GET` with `generateStaticParams = () => PUBLIC_PAGE_IDS.map((page) => ({ page }))`, `dynamicParams = false`; `metadata.ts`: `pageOgPath(id: PublicPageId): string` → `/og/${id}`, used by `pageMetadata` when no image (`rootMetadata` keeps `GENERATED_OG`).

- [ ] **Step 1: Failing tests**
  - `og-card.test.tsx` (MK's): renders title, eyebrow, site name; colours applied.
  - `metadata.test.ts`: no image → `openGraph.images[0].url '/og/about'` with 1200×630 and twitter image same; `rootMetadata` still `/og`.
  - `src/server/lib/seo/og.test.ts` (unit, `getSetting` mocked): `ogSubjectFor('about')` title = `seo.page.about.ogTitle` when set, else SEO title, else `'About'`; home with nothing set → site name; eyebrow = `PUBLIC_PAGES.home.title`.
- [ ] **Step 2:** `yarn vitest run --project unit src/lib/seo src/server/lib/seo` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `yarn build` lists `/og/[page]` prerendered (8 paths) and every marketing page still `○`; `curl -sI localhost:31${NN}/og/about` → `200 image/png`; `/og/nope` → 404. `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(seo): add branded per-page share cards`.

### Task 4: AI base URL DNS-rebinding guard (P9 parked)

**Files:** Create `src/server/lib/net/safe-fetch.ts` (+ `safe-fetch.test.ts`); Modify `src/server/services/ai/provider.ts`, `src/server/services/ai/models.ts` (+ `models.test.ts`), `package.json`/`yarn.lock` (`yarn add undici@7.29.1 --exact`).
**Interfaces (Produces):** `isPrivateAddress(address: string): boolean` (IPv4 `0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12, 192.0.0/24, 192.168/16, 198.18/15, 224/4, 240/4`; IPv6 `::`, `::1`, `fc00::/7`, `fe80::/10`, `ff00::/8`, IPv4-mapped `::ffff:a.b.c.d` judged as IPv4); `fetchFor(allowPrivate: boolean): typeof fetch` — `allowPrivate` → `globalThis.fetch`; else undici `fetch` with a module-level `Agent({ connect: { lookup } })` whose lookup resolves `{ all: true }` and errors `PrivateAddressError` ("That address points to a private network") if any address is private; IP-literal hostnames are checked before the request. Always `redirect: 'error'`. Provider's openai-compatible client and `listModels` for openai-compatible use `fetchFor(localHttpAllowed())`; Google/Anthropic keep `noRedirectFetch`. Errors surface through the existing `sanitise` path.

- [ ] **Step 1: Failing tests** — `safe-fetch.test.ts`: table of private/public addresses (incl. `::ffff:127.0.0.1` private, `8.8.8.8` public, `2001:4860::8888` public); `fetchFor(false)('http://127.0.0.1:9/x')` rejects with `PrivateAddressError` without connecting; lookup stub returning `[{address:'10.0.0.5',family:4}]` for `evil.example` → rejects; `fetchFor(true)` is `globalThis.fetch`. `models.test.ts`: openai-compatible list with a base URL whose (stubbed) lookup returns `169.254.169.254` → error message "That address points to a private network", key never in the message.
- [ ] **Step 2:** `yarn vitest run --project unit src/server/lib/net src/server/services/ai` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `yarn vitest run --project integration tests/integration/ai-settings.test.ts tests/integration/ai-chat.test.ts`; `tsc`, `lint`.
- [ ] **Step 5:** Commit `fix(ai): refuse provider hosts that resolve to private networks`.

### Task 5: Appearance polish (P8 parked: contrast, live light/dark, draft cookie)

**Files:** Modify `src/lib/theme/checks.ts` (+ test), `src/components/marketing/stitch-estimator.tsx` (error text class only), the Appearance live-token hook (`useLiveAdmin`, `src/features/appearance/**`) (+ test), `src/features/appearance/components/appearance-view.tsx` (+ `appearance-view.test.tsx`). (The eyebrow-contrast note is written by Task 8's runbook §4.)
**Interfaces:** `checks.ts` pair list gains `['brand-mid','surface',4.5]`; `useLiveAdmin(draft)` also applies `draft.admin.mode` (`light`/`dark`/`system`) to `document.documentElement` classes while mounted and restores the published mode on cleanup; `appearance-view.tsx` calls `exitDraftOnLeave()` on unmount and `pagehide`: `fetch('/api/v1/preview/exit?path=/', { keepalive: true, redirect: 'manual', credentials: 'same-origin' })`, skipped when the "Preview on site" link was clicked during this mount.

- [ ] **Step 1: Failing tests** — `checks.test.ts`: default theme passes every pair; a brand of `#7f1d1d` fails `brand-mid` on surface. Hook test: draft mode `dark` with published `light` → `html.dark` present; unmount → absent. `appearance-view.test.tsx`: unmount calls `fetch` with `/api/v1/preview/exit?path=/` + `keepalive: true`; after clicking "Preview on site", unmount does not call it. Estimator: rendered error message has class `text-brand-soft`.
- [ ] **Step 2:** `yarn vitest run --project unit src/lib/theme src/features/appearance src/components/marketing` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `CHECK_BUILD_CSS=1 yarn vitest run --project unit src/components/marketing/brand-tokens.test.ts` after `yarn build` (marketing pages `○`); `tsc`, `lint`.
- [ ] **Step 5:** Commit `fix(theme): check mid brand contrast, preview admin mode live, leave draft mode with Appearance`.

### Task 6: Single source of default copy (P4 M6)

**Files:** Modify `src/server/lib/settings/public-settings.ts`, `src/server/lib/settings/site-settings-migration.ts`, `src/lib/content/globals.test.ts`; Delete `src/features/{about,insurance,process}-page/defaults.ts`; Create `src/lib/content/defaults-source.test.ts`.
**Interfaces:** `defaultPublicGlobals(): PublicGlobals` (each `PUBLIC_SETTINGS_KEYS` key → `parseGlobal(key, undefined)`); `FALLBACK_SETTINGS` = the same field values derived from `defaultPublicGlobals()` (keep its exported name and type so callers do not change); the migration reads page defaults from `parseGlobal('page.about'|'page.insurance'|'page.process', undefined)`.

- [ ] **Step 1: Failing tests** — `defaults-source.test.ts`: no file under `src/` or `scripts/` imports `features/(about|insurance|process)-page/defaults` (glob + regex); `FALLBACK_SETTINGS.phone === parseGlobal('contact', undefined).phone.display`, `FALLBACK_SETTINGS.businessName === parseGlobal('site', undefined).name`. Remove the `ABOUT_DEFAULTS`/`INSURANCE_DEFAULTS`/`PROCESS_PAGE_DEFAULTS` equality block from `globals.test.ts`.
- [ ] **Step 2:** `yarn vitest run --project unit src/lib/content src/server/lib/settings` → FAIL.
- [ ] **Step 3:** Implement; delete the three files.
- [ ] **Step 4:** PASS; `yarn vitest run --project integration tests/integration/site-settings-migration.test.ts tests/integration/settings.test.ts`; `yarn settings:migrate --verify` against the slot DB after `settings:migrate` → `OK`; `tsc`, `lint`.
- [ ] **Step 5:** Commit `refactor(settings): derive fallback copy from the globals schemas`.

### Task 7: Test hygiene (flaky lazy-chunk test, auditRoute load failure)

**Files:** Modify `src/features/ai/components/assistant-lazy.test.tsx`; Create `tests/integration/audit-route-load.test.ts`; Modify `src/components/admin/schema-form/to-fields.test.ts` (wrap `ui.remove` cleanup in `try/finally`).
- [ ] **Step 1:** Lazy test: `findByLabelText('Message the AI assistant', {}, { timeout: 5000 })`. New integration test: PATCH a quote request with `quoteRequestRepository` `load` (the spec's `load`) mocked to throw → response 200 and body unchanged, zero new `audit_logs` rows, `console.error` called once with `'[audit-route] load failed'` (`audit-route.ts:53-66`).
- [ ] **Step 2:** `for i in 1 2 3 4 5 6 7 8 9 10; do yarn vitest run --project unit src/features/ai || break; done` → 10 green runs; `yarn vitest run --project integration tests/integration/audit-route-load.test.ts` → PASS (it pins existing behaviour; RED is not expected).
- [ ] **Step 3:** Commit `test: stabilise the AI lazy-chunk test and pin audit load failures`.

### Task 8: `yarn legacy:check` and the Phase 11 runbook

**Files:** Create `src/server/lib/legacy/legacy-check.ts`, `scripts/legacy-check.ts`, `tests/integration/legacy-check.test.ts`, `docs/setup/production-cutover-phase-11.md`; Modify `package.json` (`"legacy:check": "tsx scripts/legacy-check.ts"`).
**Interfaces (Produces):** `LegacyItem = { name: string; count: number; hint: string }`, `LegacyReport = { ok: boolean; items: LegacyItem[] }`, `runLegacyCheck(db: DbLike): Promise<LegacyReport>`. Items (hint = the command that fixes it):
- one per pair `services.icon|image`, `projects.before|after`, `project_gallery_images.image`, `partner_logos.logo`, `homepage_catalogs.icon`, `testimonials.avatar`: rows with `*_public_id` set and `*_media_id` null → `yarn media:migrate`;
- `enquiry photos not linked`: `photo_urls` entries without a linked `enquiry_photos` media whose `legacy_source` matches (reuse `publicIdFromUrl`/`legacySourceOf`) → `yarn media:migrate`;
- `settings keys missing`: `PUBLIC_SETTINGS_KEYS` without a `settings` row → `yarn settings:migrate`;
- `settings with Cloudinary images`: stored values holding an `ImageRef` of kind `cloudinary` (walk like `collectMediaIds`) → `yarn media:migrate`;
- `quotes assigned only to legacy admins`: `assigned_admin_id` set, `assigned_user_id` null → `yarn auth:migrate-admins`;
- `admin accounts not migrated`: active `admin_users` whose lower(email) has no `users` row → `yarn auth:migrate-admins`.
CLI prints `name  count  hint` lines and `OK` (exit 0) or `NOT READY` (exit 1). Read-only (no writes, no audit).
Runbook sections: **1. What Phase 11 changes** (spam, dashboard visibility, export/privacy, author rule, share cards, purge job, migration 0028 via `yarn db:deploy`); **2. Stage A gate** (Controller call 16: deploy order, `yarn legacy:check` must print `OK`, fall back to tag `p11-pre-legacy-removal`); **3. Stage B** (placeholder heading "Completed by Task 21"); **4. Design notes** (eyebrow contrast, Controller call 14).

- [ ] **Step 1: Failing test** `legacy-check.test.ts`: empty migrated DB with all 9 settings keys → `ok: true`, all counts 0; insert one service with `icon_public_id` only → that item 1, `ok false`; a quote with `photo_urls ['https://res.cloudinary.com/x/image/upload/v1/a.jpg']` and no link → 1; delete the `contact` settings row → `settings keys missing` 1; quote with `assigned_admin_id` only → 1.
- [ ] **Step 2:** `yarn vitest run --project integration tests/integration/legacy-check.test.ts` → FAIL.
- [ ] **Step 3:** Implement + runbook.
- [ ] **Step 4:** PASS; `yarn legacy:check` against the slot DB prints the table; `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(ops): add the legacy data check and the Phase 11 runbook`.

### Task 9: Spam model — server and public forms (P4 parked, P10 M-3)

**Files:** Create `src/lib/enquiries/spam.ts` (+ test), `src/server/lib/enquiries/stamp.ts` (+ test, port of MK `server/modules/leads/stamp.ts`), `src/server/lib/enquiries/classify.ts` (+ test), `src/server/api/public-stamp.ts`, `src/features/enquiries/hooks/use-enquiry-stamp.ts`, `src/components/marketing/honeypot-field.tsx`, `tests/integration/enquiry-spam.test.ts`; Modify `src/validations/{quote-request,contact-message}-schema.ts`, `src/server/api/{quote-requests,contacts}.ts`, `src/server/services/{quote-request,contact-message}-service.ts`, `src/server/repositories/{quote-request,contact-message}-repository.ts`, `src/server/services/retention-service.ts`, `src/server/services/ai/tool-data.ts`, `src/features/globals/global-ui.ts`, `src/features/{quote-requests,contact-messages}/components/*-status-badge.tsx` (add `spam` label only), `src/components/marketing/{quote-form,contact-form,stitch-estimator}.tsx`, shared `api/index.ts` + `api-routes.ts`.
**Interfaces:**
- Consumes: Task 1 `spamReason` columns, `noBillingData()`, `hasBillingData()`.
- Produces: `spam.ts` (pure): `SPAM_STATUS = 'spam'`, `SPAM_REASONS = ['honeypot','stamp','too-fast','manual'] as const`, `SpamReason`, `spamReasonLabel(reason: string | null): string` — MK copy `honeypot` "Hidden field filled in", `stamp` "Form stamp missing or expired", `too-fast` "Submitted too quickly", plus `manual` "Marked as spam by staff", null → "Unknown". `retention-service.ts` re-exports `SPAM_STATUS` from it.
- `stamp.ts`: `STAMP_MIN_MS = 3_000`, `STAMP_MAX_MS = 7 * 86_400_000`, `issueStamp(now?)`, `checkStamp(stamp, now?) : 'ok' | 'stamp' | 'too-fast'` (HMAC via `derivedHmac('enquiry-stamp', ms).slice(0, 32)`).
- `classify.ts`: `classifySubmission(body: { website?: string; stamp?: string }, now?: number): SpamReason | null` (non-blank `website` → `honeypot`; else stamp result).
- `GET /api/v1/public/enquiry-stamp` → `{ stamp }`, `Cache-Control: no-store`, rate-limited 60/min. `API_ROUTES.enquiryStamp = '/public/enquiry-stamp'`.
- Public schemas accept optional `website: z.string().max(200)`, `stamp: z.string().max(100)`; both stripped before create.
- `quoteRequestService.create(data, { notify?, photoMediaIds?, spamReason?: SpamReason })` / contact equivalent: spam → `status 'spam'`, `spamReason`, no notify; public routes skip `storeEnquiryPhotos` and `queueLeadConversionAfterResponse` for spam and return the same 201 shape.
- Statuses: `'spam'` appended to `ALL_QUOTE_STATUSES` (not `PIPELINE_STATUSES`) and `CONTACT_STATUSES`. PATCH `status:'spam'` → `spamReason 'manual'`; quote with `hasBillingData` → 422 "This quote has invoice or payment records, so it can't be marked as spam."; PATCH from `spam` to any status → `spamReason null`.
- Lists: `status 'all'` excludes spam; `status 'spam'` lists spam only. Stats: totals and `new` exclude spam; add `spam: number`. The sidebar new-enquiries count and AI `getQuoteStats`/`getContactStats` exclude spam.
- Retention spam predicate for quotes adds `noBillingData()`.
- `global-ui.ts` `spamRetentionDays` description → "Applies to enquiries marked as spam."
- Forms: `useEnquiryStamp(): string` (fetch on mount, `''` on failure); `<HoneypotField />` (MK pattern: `name="website"`, off-screen, `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`); both values sent in the POST body.

- [ ] **Step 1: Failing tests**
  - unit: `stamp.test.ts` (MK cases: ok at 5 s, `too-fast` at 1 s, expired at 8 days, tampered mac → `stamp`, garbage → `stamp`); `classify.test.ts`; `spam.test.ts` labels.
  - `enquiry-spam.test.ts`: quote with `website:'x'` → 201, row `status 'spam'`, `spam_reason 'honeypot'`, no email sent (mailer mock), no `enquiry_photos`, CAPI queue not called; missing stamp → `stamp`; 1-s-old stamp → `too-fast`; valid 5-s stamp → `new`; same for contacts; `GET /admin/list?status=all` excludes spam, `?status=spam` returns it; stats `spam: 1`; PATCH spam on a quote with `invoiceNumber` → 422 and row unchanged; PATCH spam on a plain quote → `spam_reason 'manual'` + audit row; PATCH back to `new` → reason null; View-as PATCH → 403; retention dry-run does not count a 60-day-old spam quote that has `paidAmount '50.00'`; notifications feed excludes spam (existing case kept).
- [ ] **Step 2:** `yarn vitest run --project unit src/lib/enquiries src/server/lib/enquiries && yarn vitest run --project integration tests/integration/enquiry-spam.test.ts tests/integration/public-forms.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `tests/integration/{retention,notifications-api,lead-capi,enquiry-notify,ai-tools}.test.ts` still PASS; `yarn build` marketing pages `○`; `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(enquiries): file bot submissions as spam with honeypot and form stamp`.

### Task 10: Authors own their draft projects (spec §5.3, P2 note)

**Files:** Create `src/lib/auth/content-access.ts` (+ test), `src/server/lib/auth/content-access.ts`, `tests/integration/content-author.test.ts`; Modify the content route files under `src/server/api/` for services, projects (incl. gallery + reorder), testimonials, partner logos, homepage pillars, catalogs, process steps (pass `actor` to services), `src/server/services/{project,service,testimonial,partner-logo,homepage-catalog,homepage-pillar,homepage-process-step}-service.ts`, `src/features/projects/components/{list/project-table,project-form}.tsx`, the create/reorder controls of the other content lists and home-page panels.
**Interfaces:**
- `isAuthorOnly(roles: readonly RoleName[]): boolean` (pure): true when every role granting `content.update` is `author` (mirror of `media-library-service.ts:63-65`).
- `assertContentWrite(actor: Actor, target: ContentTarget): void` throws `ApiError` 403 `FORBIDDEN`; `ContentTarget = { type: 'project'; action: 'create' } | { type: 'project'; action: 'update' | 'reorder' | 'gallery'; row: { createdBy: string | null; status: string }; patch?: Record<string, unknown> } | { type: 'service' | 'testimonial' | 'partner-logo' | 'pillar' | 'catalog' | 'process-step'; action: 'create' | 'update' | 'reorder' }`. Messages: other types or someone else's/published project → "Authors can only add and edit their own draft projects."; patch touching `status`, `isFeatured` or `displayOrder`, or `reorder` → "Only an editor can publish, feature or reorder projects."
- Project create sets `createdBy = actor.userId` for everyone; for author-only it forces `status 'draft'`, `isFeatured false`.
- UI: author-only sees no create/reorder/enable controls outside Our work; project table edit link only on own drafts; project form hides Status and Featured for author-only.

- [ ] **Step 1: Failing tests** — `content-access.test.ts` (each branch + messages); `content-author.test.ts` (seeded `author` and `editor`): author creates project with `status:'published', isFeatured:true` → stored draft/not featured with `created_by`; author updates own draft → 200 + audit; author updates editor's project → 403, row unchanged, no audit row; author PATCH `status:'published'` on own → 403; author reorder → 403; author creates service/testimonial → 403; editor unaffected (all 200); View-as author by owner → 403 `IMPERSONATION_READ_ONLY` (existing guard first).
- [ ] **Step 2:** `yarn vitest run --project unit src/lib/auth && yarn vitest run --project integration tests/integration/content-author.test.ts tests/integration/rbac-api.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `tests/integration/content-media.test.ts`, `audit-coverage.test.ts` PASS; editor can still do everything on services/projects/home tabs (browser spot check); `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(rbac): limit authors to their own draft projects`.

### Task 11: Media object purge and upload admission (P5 M2, M8)

**Files:** Create `src/server/services/media-purge-service.ts`, `src/server/lib/media/upload-admission.ts` (+ test), `tests/integration/media-purge.test.ts`; Modify `src/server/services/media-library-service.ts` (`replace`, `remove`), `src/server/api/admin-media.ts` (POST `/`, POST `/:id/replace`), `scripts/retention.ts`, `docs/setup/cron.md`.
**Interfaces:**
- `MEDIA_PURGE_DELAY_DAYS = 30`; `enqueueObjectPurge(tx: DbLike, keys: string[], reason: MediaPurgeReason, now?: Date): Promise<void>` (upsert, keeps the earliest `due_at`); `purgeMediaObjects(now?: Date, limit = 200): Promise<{ deleted: number; skipped: number }>` — for each due key: skip (and drop the queue row) when a live `media` row still uses that key; else `getStorage().delete(key)` (missing object = success), delete the queue row; one system `audit` `media.purge` (`entityType 'media'`, summary `Removed N stored files`) when `deleted > 0`; `countDuePurges(now?: Date): Promise<number>`.
- `replace` queues the old storage key(s) (`'replaced'`) and `remove` queues the row's key(s) (`'deleted'`) inside their existing transactions (variant keys included, as the row records them).
- `withUploadAdmission<T>(work: () => Promise<T>): Promise<T>`, `UPLOAD_ADMISSION = { running: 2, queued: 8 }`; overflow throws `ApiError.serviceUnavailable('The server is busy. Try again in a moment.')`. Admin upload routes wrap `c.req.parseBody()` and the service call in it.
- `scripts/retention.ts`: after `runRetention` (and the AI purge), `purgeMediaObjects()`; `--dry-run` prints `media files due: <countDuePurges()>` and deletes nothing. `cron.md` notes deleted/replaced files leave storage 30 days later.

- [ ] **Step 1: Failing tests** — `upload-admission.test.ts`: 10 pending works accepted, 11th rejects 503 before its `work` runs; a finished slot admits the next. `media-purge.test.ts` (local driver): replace → old key queued with `due_at ≈ now+30d`; `purgeMediaObjects(now)` deletes nothing; `purgeMediaObjects(now+31d)` deletes the old file from `.test-uploads`, queue empty, one `media.purge` audit; soft delete → queued → purged later, `media` row still present with `deleted_at`; a key shared by another live row is skipped and kept on disk.
- [ ] **Step 2:** `yarn vitest run --project unit src/server/lib/media/upload-admission.test.ts && yarn vitest run --project integration tests/integration/media-purge.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `tests/integration/{media-api,media-usage,retention}.test.ts` PASS; `yarn jobs:retention --dry-run` prints the new line; `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(media): purge replaced and deleted files and bound concurrent uploads`.

### Task 12: Dashboard — MK cards, role-aware data (P3 T5 minors)

**Files:** Create `src/server/services/dashboard-service.ts`, `src/components/admin/dashboard/{pill-bar-chart,activity-feed}.tsx` (+ tests; ports of MK), `src/features/dashboard-overview/utils/present.ts` (+ test, port of MK `admin/modules/dashboard/present.ts`), `tests/integration/dashboard.test.ts`; Modify `src/app/(main)/(protected)/(dashboard_layout)/dashboard/page.tsx`, `src/features/dashboard-overview/components/dashboard-overview-view.tsx`, `src/features/dashboard-overview/types/index.ts`, `src/server/services/analytics-service.ts` (exclude spam), `src/components/admin/dashboard/skeletons.tsx` (`KpiRowSkeleton` columns match the row).
**Interfaces:**
- `NextUpItem = { id: 'enquiry' | 'two-factor' | 'invite'; title; description; cta; href; done: boolean }`.
- `DashboardDto = { generatedAt: string; enquiries: { value: number; previous: number } | null; enquiriesWeek: { days: { key; label; current; previous }[]; current: number; previous: number } | null; seoHealth: { score: number; issues: number } | null; contentHealth: { complete: number; needsWork: number; missing: number; findings: { label: string; message: string; href: string }[] | null; findingsTotal: number } | null; recentActivity: { id; actorName: string | null; actorEmail: string | null; action: string; summary: string; createdAt: string }[] | null; nextUp: NextUpItem[]; pipeline: DashboardOverviewData | null }`.
- `getDashboard(actor: Actor, now?: Date): Promise<DashboardDto>`: enquiry counts (quotes + contacts, non-spam; 30 days vs previous 30; Mon–Sun Irish week vs last) when `quote.read || contact.read`, else `null`; `seoHealth`/`contentHealth` from `getSeoHealth()` when `seo.read` (complete = passed checks, needsWork = failed checks, missing = `alt.missing`; findings top 10 when `seo.update`); `recentActivity` 8 rows when `audit.read`; `nextUp` = oldest `new` non-spam enquiry (MK copy "Reply to {first}" / "Waiting since {d MMM}: the oldest enquiry nobody has contacted yet." / "Open enquiry", href to its detail page) when readable, MK two-factor step (href `/dashboard/account`), "Invite your team" when `user.create`; `pipeline = analyticsService.getOverviewData()` only when `quote.read`.
- `present.ts`: `greetingFor`, `dashboardGreeting(name, generatedAt, renderedAt)`, `actionStatus(action)`, `kpisFor(dto, can)` (New enquiries hero + SEO health; links only when the target opens), `setupSteps(items)`.
- View: `PageHeader` title = greeting, description MK "Here's what's happening across your admin."; actions = existing New enquiry + Pipeline Board (quote.read), existing Website Pages, MK "View site" (new tab, `NEXT_PUBLIC_APP_URL`). Body order: MK KPI row → [Enquiries this week | Next up] → [Team activity | Content health] → VANTAGE pipeline block unchanged when `pipeline` (KpiMetricCards, MonthlyIntakeChart, ChannelBreakdown, RecentActivityFeed). Error/empty states via `EmptyState` (MK copy "The dashboard didn't load" / "Check your connection, then try again." / "Try again").

- [ ] **Step 1: Failing tests** — MK `present.test.ts`, `pill-bar-chart.test.tsx`, `activity-feed.test.tsx` ported; `dashboard.test.ts`: owner → `pipeline` set, `recentActivity` array; marketer → `pipeline null`, `enquiries null`, no string in the JSON-serialised DTO equals any seeded customer name/email/phone; intake → `pipeline` set, `recentActivity null`, `seoHealth null`; a spam quote is not counted; editor `nextUp` has no enquiry step.
- [ ] **Step 2:** `yarn vitest run --project unit src/components/admin/dashboard src/features/dashboard-overview && yarn vitest run --project integration tests/integration/dashboard.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `tests/integration/ai-tools.test.ts` (dashboard summary contract) PASS; browser: owner sees MK cards + the full VANTAGE block; `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(admin): MK dashboard cards with role-aware enquiry data`.

### Task 13: Enquiry CSV export and privacy requests (MK leads parity)

**Files:** Create `src/server/api/admin-enquiries.ts`, `src/server/services/{enquiry-export,enquiry-privacy}-service.ts`, `src/features/enquiries/components/{enquiry-actions,privacy-request-dialog}.tsx` (+ dialog test), `tests/integration/enquiry-export.test.ts`, `tests/integration/enquiry-privacy.test.ts`; Modify shared `api/index.ts`, `api-routes.ts`, and the two inbox views (insert `<EnquiryActions type=… />` into `PageHeader` actions only).
**Interfaces:**
- Consumes: Task 1 `noBillingData()` / `hasBillingData()`; Task 9's spam filter is not needed (export filters `status <> 'spam'` itself via `SPAM_STATUS` from `retention-service.ts`).
- Routes `/admin/enquiries`: `GET /export.csv?type=quotes|contacts&status=` — `can` per type (`quote.export` / `contact.export`, checked in the handler since it depends on `type`), `rateLimit(10, 60_000)`, `text/csv; charset=utf-8`, `attachment; filename="quotes-YYYY-MM-DD.csv"` (Irish day), `audit` `quote.export|contact.export` summary `Exported N rows`; spam excluded unless `status=spam`. `GET /privacy?email=` — needs `quote.export` **and** `contact.export`; JSON download `privacy-YYYY-MM-DD.json` `{ email, exportedAt, quotes: [...all columns + photo URLs], contacts: [...] }`; audit `privacy.export`, `entityType 'person'`, `entityId derivedHmac('privacy-email', email.toLowerCase())`. `DELETE /privacy?email=` — needs `quote.delete` **and** `contact.delete`, `notViewingAs`; deletes all matching contacts and quotes without billing data (their enquiry photos via the existing enquiry media hard-delete), keeps the rest; returns `{ deleted: { quotes: number; contacts: number }; kept: { id: string; reason: 'billing' }[] }`; audit `privacy.erase` with counts only, in the same transaction.
- `exportCsv(actor, type, status?): Promise<{ filename: string; csv: string; count: number }>` (uses `toCsv` from `src/server/lib/csv.ts`); `exportPerson(actor, email)`; `erasePerson(actor, email)`.
- UI: `EnquiryActions({ type: 'quotes' | 'contacts' })` — MK "Export CSV" (Download icon) when export allowed, MK "Privacy request" (Shield icon) when both exports allowed; `PrivacyRequestDialog` (port of MK `privacy-request-dialog.tsx`): email field, "Download data", "Erase data" (enabled only with both deletes and not View-as; confirm by retyping the email), result list shows kept quotes with "Kept: invoice or payment records (6-year accounting rule)".

- [ ] **Step 1: Failing tests** — export: owner CSV header + 2 rows, spam row absent, `?status=spam` → spam only, audit row; intake (no export) → 403; 11th call in a minute → 429. Privacy: export lists both kinds case-insensitively; marketer → 403; erase deletes contact + unpaid quote + its photo file, keeps paid quote (reported), audit has counts and no email; View-as → 403; dialog test: Erase disabled until the email is retyped.
- [ ] **Step 2:** `yarn vitest run --project unit src/features/enquiries && yarn vitest run --project integration tests/integration/enquiry-export.test.ts tests/integration/enquiry-privacy.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `audit-coverage.test.ts`, `audit-route.test.ts` scan PASS; `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(enquiries): add CSV export and privacy requests`.

### Task 14: Spam and enquiry list UI (MK status pills, empty states)

**Files:** Modify `src/features/quote-requests/components/{quote-status-badge,quote-source-badge,list/quote-status-tabs,list/quote-request-table,inbox/quote-inbox-view,inbox/quote-inbox-detail,detail/quote-detail-view,kanban/quote-kanban-view}.tsx`, `src/features/contact-messages/components/{contact-status-badge,list/contact-status-tabs,list/contact-message-table,inbox/contact-inbox-view,inbox/contact-inbox-detail,detail/contact-detail-view}.tsx`, the quote/contact list hooks' query params; Create `src/features/enquiries/components/spam-actions.tsx` (+ test).
**Interfaces:** Consumes Task 9 statuses/`spamReasonLabel`/`stats.spam`, `StatusPill`/`toneForStatus`/`EmptyState` (`src/components/admin/dashboard`). `SpamActions({ kind: 'quote' | 'contact', id, status, spamReason, hasBilling? })`: "Mark as spam" (destructive outline) or "Not spam", shown with `quote.update`/`contact.update`, hidden under View-as; uses the existing update mutations; a 422 shows its toast. Spam tab (with count) in both status tab lists and inbox filters; kanban never shows spam; spam rows show "Spam · {reason label}". Status and source badges render `StatusPill` (labels unchanged; source label capitalised). Empty lists use `EmptyState` (MK pattern, copy "No enquiries here yet").

- [ ] **Step 1: Failing tests** — `spam-actions.test.tsx`: new quote → "Mark as spam" calls update with `{status:'spam'}`; spam → "Not spam" calls `{status:'new'}`; View-as → nothing rendered; badge test: `spam` renders the danger tone with label "Spam".
- [ ] **Step 2:** `yarn vitest run --project unit src/features/enquiries src/features/quote-requests src/features/contact-messages` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; browser: inbox, kanban (drag still works), table, detail for both kinds, Spam tab round-trip; `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(enquiries): spam folder, spam actions and MK status pills`.

### Task 15: Media save-versus-delete race (P5 M1)

**Files:** Modify `src/server/lib/media/content-images.ts`, the five content services that call `prepareMediaWrite` + the project gallery path, their repositories (optional `dbLike` param on the write methods), `src/server/services/globals-service.ts` (`saveGlobal` callback), `tests/integration/content-media.test.ts`, `tests/integration/globals-api.test.ts`.
**Interfaces:** `prepareMediaWrite<T extends object>(data: T, pairs: readonly Pair[]): Promise<{ data: T; mediaIds: string[] }>` (early check unchanged); `writeWithMedia<R>(mediaIds: string[], write: (tx: DbLike) => Promise<R>): Promise<R>` = one transaction: `write(tx)` then `assertMediaExists(mediaIds, tx)` (throws 422 → rollback). `saveGlobal` re-runs `assertMediaExists(collectMediaIds(value), tx)` inside the `settingsRepository.save` callback.

- [ ] **Step 1: Failing tests** — `content-media.test.ts`: `writeWithMedia([id], async (tx) => { await updateService(tx); await softDelete(id, tx) })` → 422 `_media` and the service row unchanged; service update with a live image → 200. `globals-api.test.ts`: `saveGlobal` whose `save` callback runs after the image row is soft-deleted (spy on `settingsRepository.save` to soft-delete before invoking the callback) → 422, version unchanged.
- [ ] **Step 2:** `yarn vitest run --project integration tests/integration/content-media.test.ts tests/integration/globals-api.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `tests/integration/{media-usage,content-author,website-page-editors}.test.ts` PASS; `tsc`, `lint`.
- [ ] **Step 5:** Commit `fix(media): re-check image references inside the content write`.

### Task 16: E.164 phone links and early Lottie size check (P4 parked)

**Files:** Create `src/lib/content/phone.ts` (+ test); Modify `src/server/lib/settings/public-settings.ts` (`PublicSiteSettings.phoneHref`), `src/components/marketing/{stitch-header,footer,contact-info,stitch-cta}.tsx`, `src/components/admin/schema-form/widgets/json-file-widget.tsx` (+ test), `src/features/globals/global-ui.ts` only if a field description mentions the unused e164 (keep it accurate).
**Interfaces:** `telHref(display: string, e164: string): string` → `tel:${e164}` when `e164` matches `^\+[1-9]\d{6,14}$`, else `tel:` + display with everything but `+` and digits removed; `whatsappHref(number: string): string` (`https://wa.me/` + digits). Marketing components use `settings.phoneHref` / `whatsappHref`. `JsonFileWidget` rejects a file over `2_000_000` bytes on selection with "Animations can be up to 2 MB" (no read, no form change).

- [ ] **Step 1: Failing tests** — `phone.test.ts`: (`'+353 1 234 5678'`, `'+35312345678'`) → `tel:+35312345678`; (`'01 234 5678'`, `''`) → `tel:012345678`; widget test: 2 000 001-byte file → error shown, `onChange` not called.
- [ ] **Step 2:** `yarn vitest run --project unit src/lib/content/phone.test.ts src/components/admin/schema-form` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `src/components/marketing/marketing-chrome.test.tsx` PASS (update expected hrefs only); `yarn build` marketing `○`; `tsc`, `lint`.
- [ ] **Step 5:** Commit `fix(site): dial the E.164 number and check animation size on pick`.

### Task 17: List visual parity (content tables, users)

**Files:** Modify `src/features/{services,projects,testimonials,partner-logos,homepage-pillars,homepage-catalogs,homepage-process-steps}/components/list/*-table.tsx`, `src/features/home-page/components/sections/*-panel.tsx` (status cells/empty state only), `src/features/users/components/users-table.tsx`.
**Interfaces:** Published/Draft, Enabled/Hidden and Featured cells render `StatusPill` with `toneForStatus`; user status renders `userStatus()` → `StatusPill` (MK `users-table.tsx`); empty lists render `EmptyState` with MK pattern copy ("No services yet" + the existing create action when allowed, etc.). No behaviour change: reorder handles, toggles and links stay.

- [ ] **Step 1: Failing tests** — one RTL test per table family (`service-table.test.tsx`, `users-table.test.tsx`): published row shows a pill with text "Published"; empty data shows the empty-state title and, for editor, the create link; for viewer no create link.
- [ ] **Step 2:** `yarn vitest run --project unit src/features/services src/features/users` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; browser: reorder (dnd) and enable toggles still work on every table; `tsc`, `lint`.
- [ ] **Step 5:** Commit `feat(admin): MK status pills and empty states on content and user lists`.

### Task 18: Stage A — stop reading legacy Cloudinary media

**Precondition:** controller has created tag `p11-pre-legacy-removal` on the feat tip.
**Files:** Modify `src/server/lib/media/{resolve,content-images,enquiry-photos}.ts`, `src/lib/media/*` `sizedSrc` (drop the Cloudinary branch), the content repositories/services/DTOs listed in the legacy grep (`service`, `project` + gallery, `testimonial`, `partner-logo`, `homepage-catalog`), `src/features/media/{lib/slot.ts,components/media-field.tsx,components/media-gallery-field.tsx}`, `src/features/{services,projects,testimonials,partner-logos,homepage-catalogs}/components/*-form.tsx`, `next.config.ts` (remove `res.cloudinary.com`), `src/server/lib/media/no-cloudinary.test.ts`; Create `src/server/lib/media/no-legacy-reads.test.ts`. **Do not touch** `get-page-seo.ts` (Task 19), `src/server/db/schema/*`, the migration CLIs/libs (`cloudinary-migration.ts`, `legacy-cloudinary.ts`, `scripts/*`), `legacy-check.ts`, or the 422 `legacyImageKey` refusal in `src/validations/*`.
**Interfaces:** `toPublicImage(row: MediaRow | null | undefined): PublicImage | null`; `contentImage(row): PublicImage | null`; enquiry photos = linked media only (no `photo_urls`); DTOs drop `*PublicId` fields and `legacyGalleryCount`; legacy-gallery read-only notice and the 409 "Migrate this gallery first" path removed; `prepareMediaWrite` pairs kept (clearing the legacy column until Stage B). Static test: no file under `src/` outside the allowlist (schema, `cloudinary-migration.ts`, `legacy-cloudinary.ts`, `site-settings-migration.ts`, `admin-migration.ts`, `legacy-check.ts`, `src/validations/*`, `src/lib/content/image-ref.ts`, `src/server/services/ai/flatten.ts`, `src/server/queries/get-page-seo.ts`, `src/server/lib/settings/*`) matches `/PublicId\b|publicId|legacyCloudinaryUrl|res\.cloudinary\.com/`.

- [ ] **Step 1: Failing tests** — `no-legacy-reads.test.ts` (above) and `no-cloudinary.test.ts` (`next.config.ts` has no `res.cloudinary.com`); `enquiry-photos.test.ts`: a quote with only `photo_urls` returns `photos: []`; `content-media.test.ts`: a service with only `icon_public_id` renders `icon: null` and its API DTO has no `iconPublicId`.
- [ ] **Step 2:** `yarn vitest run --project unit src/server/lib/media && yarn vitest run --project integration tests/integration/enquiry-photos.test.ts tests/integration/content-media.test.ts` → FAIL.
- [ ] **Step 3:** Implement (update every existing test that asserted the fallback to the new behaviour).
- [ ] **Step 4:** PASS; full `yarn test`; `yarn build` marketing `○`; `yarn legacy:check` still runs (it reads the columns directly); `tsc`, `lint`.
- [ ] **Step 5:** Commit `refactor(media): stop reading legacy Cloudinary ids`.

### Task 19: Stage A — stop reading the legacy `site_settings` row

**Files:** Modify `src/server/services/site-settings-service.ts`, `src/server/lib/settings/public-settings.ts`, `src/server/queries/get-setting.ts` (remove `getLegacySettings`), `src/server/services/globals-service.ts` (`getGlobal` legacy fallback), `src/server/queries/get-page-seo.ts` (`withLegacyMeta` removed; `resolveImageRef` returns `null` for `kind: 'cloudinary'`), `src/app/layout.tsx` and every consumer of the removed `metaTitle`/`metaDescription`/`ogImage`/`twitterHandle` public fields, `src/server/api/site-settings.ts` (`Cache-Control: no-store`, P4 M9), affected tests; Create `src/server/lib/settings/no-legacy-settings.test.ts`.
**Interfaces:** `siteSettingsService.getPublic(): Promise<PublicSiteSettings>` = `composePublicSettings(await all getSetting(k) for PUBLIC_SETTINGS_KEYS, loadPublicImages(...))` — no `site_settings` read; `PublicSiteSettings` becomes an explicit type (no `typeof siteSettings` dependency) without the four legacy meta fields; `composeLegacyView`/`resolvePublicGlobals` legacy branches removed; `getGlobal` of a never-saved key returns schema defaults. `site-settings-repository.ts` and `site-settings-migration.ts` stay for the CLI (Stage B deletes them). Static test: only `scripts/`, `site-settings-migration.ts`, `site-settings-repository.ts`, `legacy-check.ts` and the schema import `site-settings-repository` or `schema/site-settings`; nothing exports `withLegacyMeta`.

- [ ] **Step 1: Failing tests** — `no-legacy-settings.test.ts` (above); integration `settings.test.ts`: a `site_settings` row with `business_name 'Legacy Name'` and a stored `site` key `'New Name'` → public name `'New Name'`; with no stored `site` key → schema default, never `'Legacy Name'`; `page-seo.test.ts`: SEO defaults come only from the `seo` key.
- [ ] **Step 2:** `yarn vitest run --project unit src/server/lib/settings && yarn vitest run --project integration tests/integration/settings.test.ts tests/integration/page-seo.test.ts tests/integration/seo-health.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; full `yarn test`; `yarn build` against an **empty** test DB (no settings rows) and against the slot DB → both OK, marketing `○`; `tsc`, `lint`.
- [ ] **Step 5:** Commit `refactor(settings): stop reading the legacy site settings row`.

### Task 20: Mobile 390px pass (P3/P4 parked)

**Files:** Only layout/class changes in the admin components found failing; record the route list and fixes in the task report.
**Method:** `yarn build && yarn start -p 31${NN}` on the slot DB with demo users (`SEED_DEMO_USERS=true yarn db:seed-demo-users`), Chrome at 390×844 (DevTools device mode or headless Chrome with `Emulation.setDeviceMetricsOverride` from a scratch script kept outside the repo). For every route below, as owner and as one restricted role: `document.documentElement.scrollWidth <= 390`; header actions wrap; section rail scrolls; tables scroll inside their card (`overflow-x-auto`), never the page; dialogs/sheets fit (`max-h-[100dvh]`, inner scroll); sticky View-as banner and toasts do not cover primary buttons.
**Routes:** `/login`, `/two-factor`, `/forgot-password`, `/dashboard`, `/dashboard/home-page` (every tab), `/dashboard/services` (+ create/edit), `/dashboard/projects` (+ edit with gallery), `/dashboard/insurance`, `/dashboard/about`, `/dashboard/process-page`, homepage pillars/catalogs/process steps/testimonials/partner logos create+edit, `/dashboard/media` (+ details sheet, picker dialog), `/dashboard/quotes` (inbox, kanban, table, detail, New enquiry dialog), `/dashboard/contacts` (+ detail), `/dashboard/seo`, `/dashboard/seo/defaults`, `/dashboard/seo/redirects`, `/dashboard/seo/pages/contact`, `/dashboard/marketing` (+ consent, events, code), `/dashboard/appearance` (Site + Admin tabs, preview), `/dashboard/settings/*` (8 pages + History sheet), `/dashboard/users` (both tabs + dialogs), `/dashboard/activity` (+ detail sheet), `/dashboard/account`, `/dashboard/no-access`, ⌘K palette, notifications popover, AI sheet; public `/` consent banner + cookie settings dialog, preview bar in draft mode.
- [ ] **Step 1:** Sweep and list every failure (route, element, screenshot name) in the report.
- [ ] **Step 2:** Fix with Tailwind responsive classes only (no behaviour changes). Inbox: below `lg` show list, then detail full width with a "Back to list" button driven by the existing selection state.
- [ ] **Step 3:** Re-sweep → zero failures; desktop 1440 spot check of the same screens unchanged; `yarn test` (RTL tests unaffected), `tsc`, `lint`.
- [ ] **Step 4:** Commit `fix(admin): make every admin screen usable at 390px`.

### Task 21: Stage B — drop legacy columns (branch `chore/p11-drop-legacy`, not merged)

**Base:** feat tip after Task 19 (and 20) merged. Controller creates the worktree on new branch `chore/p11-drop-legacy`; **the controller does not merge it.**
**Files:** Modify `src/server/db/schema/{services,projects,project-gallery-images,partner-logos,homepage-catalogs,testimonials,quote-requests,contact-messages,relations,index}.ts`; Delete `src/server/db/schema/{admin-users,site-settings}.ts`, `src/server/lib/media/{cloudinary-migration,legacy-cloudinary}.ts`, `src/server/lib/settings/site-settings-migration.ts`, `src/server/repositories/site-settings-repository.ts`, `src/server/lib/auth/admin-migration.ts`, `src/server/lib/legacy/legacy-check.ts`, `scripts/{migrate-cloudinary-media,cloudinary-cleanup,migrate-site-settings,migrate-admins,legacy-check}.ts`, their tests (`tests/integration/{cloudinary-migration,site-settings-migration,admin-migration,legacy-check}.test.ts`), the `package.json` scripts `media:migrate`, `media:cloudinary-cleanup`, `settings:migrate`, `auth:migrate-admins`, `legacy:check`; Remove `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` from `src/lib/env.ts` + `.env.example`; remove the `cloudinary` member of `ImageRef` (`src/lib/content/image-ref.ts`) and the paired-legacy logic in `prepareMediaWrite`/`legacyImageKey`; Create migration `0029_drop_legacy.sql`, `tests/integration/drop-legacy-migration.test.ts`; complete runbook §3 (on this branch).
**Migration:** `yarn db:generate` after the schema edits, then prepend one `DO $$ … $$;` block that `RAISE EXCEPTION 'Legacy data is not migrated (%): run yarn legacy:check on the previous release', <item>` when any of: a `*_public_id` set with its `*_media_id` null (each pair); `photo_urls` with more entries than linked `enquiry_photos` for that enquiry; fewer than 9 `PUBLIC_SETTINGS_KEYS` rows in `settings`; any `settings.value::text` containing `"kind": "cloudinary"`; a quote with `assigned_admin_id` set and `assigned_user_id` null. Then the generated `DROP COLUMN`/`DROP TABLE` statements.
**Runbook §3 (exact order):** owner decides (≥ 7 days after the Stage A cutover); `pg_dump` backup + restore check; `yarn legacy:check` on the **current** release → `OK`; merge `chore/p11-drop-legacy` (renumber `0029` if `main` gained migrations); build and deploy the code **first** (it no longer selects the columns); then `yarn db:deploy`; verify `/`, `/services`, `/our-work` images, an enquiry with photos, assignee names; rollback = restore the dump + redeploy the previous image.

- [ ] **Step 1: Failing test** `drop-legacy-migration.test.ts` (own fresh DB `vantage_p11_21_guard_test`): migrate to 0028, seed one service with `icon_public_id` only, run 0029 → throws with the message and every column still exists; fix the row (set `icon_media_id`), seed the 9 settings keys, rerun → columns and both tables gone.
- [ ] **Step 2:** `yarn vitest run --project integration tests/integration/drop-legacy-migration.test.ts` → FAIL.
- [ ] **Step 3:** Implement; `grep -rn "PublicId\|publicId\|cloudinary\|site_settings\|adminUsers" src scripts` → only historical comments or the guard test.
- [ ] **Step 4:** PASS; full `yarn test`; `yarn build`; `tsc`, `lint`.
- [ ] **Step 5:** Commit on the branch `feat(db): drop legacy Cloudinary, settings and admin columns (owner-gated)`. Report the branch head; do not merge.

### Phase exit check

- [ ] `yarn tsc --noEmit`, `yarn lint` 0 errors, `yarn test` green (controller full suite on `vantage_p11final_test`), `CHECK_BUILD_CSS=1` CSS tests after `yarn build`; build lists `/`, `/services`, `/our-work`, `/insurance`, `/about`, `/process`, `/contact`, `/get-a-quote`, `/robots.txt`, `/sitemap.xml`, `/og` as `○` and `/og/[page]` prerendered; `yarn db:migrate` applies `0028` on a fresh DB; `yarn legacy:check` on the dev DB prints `OK` (after the dev DB has run the three migration CLIs); `chore/p11-drop-legacy` full suite green on its own DB.
- [ ] Controller browser check — `yarn build && yarn start` with `SITE_ENV=production`, demo users seeded, `AI_PROVIDER_MOCK=true`, SMTP unset unless stated. Every item at **[D]** 1440×900 and **[M]** 390×844 (Chrome device mode; Safari for video). [M] means: no horizontal page scroll, all controls reachable, dialogs/sheets fit.
  - **Phase 5 — Media**
    1. [D][M] `/dashboard/media`: upload JPEG, PNG, WebP, MP4, PDF; SVG, renamed `.exe`, >20 MB image → clear errors; search, type filter, "Missing alt"; edit alt, caption, focal point, decorative; replace image→image works, image→video refused.
    2. [D] Delete an image a service uses → 409 listing usage with working links; delete an unused one → gone, a `media_object_purges` row exists with `due_at` 30 days out.
    3. [D] Start three 90 MB video uploads plus nine more quickly → none fail except overflow beyond 10 with "The server is busy. Try again in a moment."
    4. [D][M] View-as marketer: no dropzone, read-only details sheet, a devtools PATCH → 403.
    5. [D] Pick → save → reload on: services (icon + image), catalogs, partner logos (required), projects (before/after required, gallery reorder, max 10), testimonials, About hero/heritage/standards/team, Home hero video + fallback, SEO share image, Appearance brand logo/favicon. Remove where nullable → public page drops it.
    6. [D][M] `/`, `/services`, `/our-work`, `/about`, `/insurance`, `/process`: images via `/_next/image` from the R2 host, hero video plays (Safari too), blur placeholders, no console errors; view-source has no `res.cloudinary.com`.
    7. [D][M] Public quote form, contact form and estimator with 4 photos (one HEIC from Chrome) → saved; inbox, detail and kanban show each photo once.
    8. [D] Author edits only own files and can pick others' files; viewer's read-only forms show thumbnails.
    9. [D] `curl -sI localhost:3000/uploads/<local key>` → `Content-Security-Policy` contains `sandbox` (P8 parked live check).
  - **Phase 6 — SEO**
    10. [D] `/dashboard/about?tab=seo`: title, 80-char description, save → view-source `/about`: `<title>` = SERP preview, description, `og:image` `/og/about` 1200×630, `twitter:card`, canonical `/about`, BreadcrumbList.
    11. [D] `/og/about`, `/og/services`, `/og/home` show the branded card (page title, tagline, site name, brand accent); publish a new brand colour → the card follows after the next request.
    12. [D][M] 40-char description → tab checklist and Overview flag it with the same count.
    13. [D] Contact noindex → `robots noindex,follow`, `/sitemap.xml` drops `/contact`, Overview issue, AI "how is my SEO?" lists it; remaining sitemap entries carry `<lastmod>` matching their last edit.
    14. [D] Site-wide noindex → `robots.txt` `Disallow: /`, empty sitemap, crawl preview agrees; revert.
    15. [D] Google code + business type Auto repair → `google-site-verification` + JSON-LD `AutoRepair` on `/`.
    16. [D] 800×400 share image → 422 "Use an image at least 1200×630 (1.91:1)".
    17. [D] Redirect `/old-about.html` → `/about` 301: visit → 301 with `cache-control: public, max-age=3600`, `?utm=x` kept, Hits 1, Last hit Irish time; `curl localhost:3000/api/v1/resolve?path=/old-about.html` five times → Hits unchanged.
    18. [D] Validation: `/services` source "That address is a live page"; `//evil.com` destination refused; loop `/a`↔`/b` "That would create a redirect loop"; dialog shows the 302 hint.
    19. [D] Turn off → private window 404; on → 301.
    20. [D][M] View-as marketer: redirect writes and SEO tab Save hidden/refused; viewer sees Overview, no dead media link.
    21. [D] Server log: requesting `/`, `/services`, assets triggers no `/api/v1/resolve`; `/dashboard` and `/login` carry `X-Robots-Tag: noindex, nofollow`.
  - **Phase 7 — Marketing**
    22. [D] Tracking off: `/`, `/about`, `/contact` source has no `vantage-tracking`, no consent dialog, no cookie-settings link, no GTM/Meta requests.
    23. [D][M] GTM `GTM-TEST123` + banner on, fresh profile: banner shows, footer "Cookie settings", `dataLayer` consent default denied, no gtm.js before a choice; banner fits 390px.
    24. [D] Accept all → cookie a:1 m:1, gtm.js requested, `POST /api/v1/public/consent` 204, no sendBeacon error; `/services` pushes one `virtual_page_view`. Reject all (fresh) → no gtm/fbevents, no `_ga`/`_fbp`.
    25. [D][M] Cookie settings reopens Customise with current toggles; turning analytics off clears `_ga*`.
    26. [D] Pixel id + Meta on: fbevents after accept on `/`, not on `/?x=1`.
    27. [D] Test CAPI without token → 422 field errors, no call to graph.facebook.com, GET has no token material.
    28. [D] Quote with consent → `generate_lead` `event_id` = POST `eventId`; response has no `photos`; bogus CAPI token → bell "Meta Conversions API failed" for owner/marketer, not editor/intake. A **spam** submission (hidden field filled) → no `generate_lead` CAPI call.
    29. [D] View-as marketer: tracking + consent disabled, Custom code hidden, URL forbidden.
    30. [D] Appearance preview with tracking on + consent accepted: no banner, no gtm.js, no snippet inside the iframe.
    31. [D] Owner `necessary` snippet `console.log('vc')` on `/services` → logs there, not on `/`, never in admin.
  - **Phase 8 — Appearance**
    32. [D] Site tab brand colour → "Draft saved", iframe reloads red→new colour with PreviewBar, no console error; `/api/v1/preview?path=/` 307 + `__prerender_bypass`, final `/` `X-Frame-Options: SAMEORIGIN` (Chrome, Firefox, Safari).
    33. [D] Draft mode: no GTM/GA4/Pixel, no banner, no snippets.
    34. [D] Private window `/`: published theme, no PreviewBar, static headers. Publish → new brand + fonts on `/`, `/services`, `/contact`; click to another dashboard page → admin theme is the new one.
    35. [D] Restore an old revision, Reset to preset → Site preview iframe updates; "Exit preview" absent inside the iframe.
    36. [D] Leave Appearance → a public tab reloads without PreviewBar (draft mode exited); open "Preview on site" first → that tab keeps the bar.
    37. [D] Admin tab: switch draft mode to dark → admin turns dark live; leave without publishing → back to the published mode.
    38. [D] Two tabs → conflict dialog (Review loads A, Overwrite wins); stale restore → "Changed by someone else".
    39. [D] Editor/marketer: no Appearance, URL redirects, `/api/v1/preview` 403; View-as admin: controls disabled, writes 403; `/api/v1/preview?path=//evil.com` 422, `/exit?path=https://evil.com` → `/`; `/dashboard/appearance` and `/` refused in a cross-origin iframe.
    40. [D][M] Ocean preset in dark: sidebar, buttons, focus rings, charts follow; light pink brand → Publish blocked, "Fix automatically" → ≥ 4.5 → Publish enabled; estimator error text readable (brand-soft).
  - **Phase 9 — AI**
    41. [D] Settings › AI assistant: provider + key → `••••last4`; reload: key never in DOM/network; List models → `mock-model`; Test connection → "Connected" + Activity `ai.test_connection`. Openai-compatible base URL `https://127.0.0.1.nip.io/v1` → refused "That address points to a private network".
    42. [D][M] Sparkle before Enquiries link; ⌘J/Ctrl+J toggles, focus in composer; sheet fits 390px.
    43. [D] "how is SEO?" streams + "Looked at: SEO health"; About page question + context chip on `/dashboard/about`, ✕ dismisses.
    44. [D] Stop mid-stream keeps partial text, Activity `· stopped` without message text; Regenerate `· regenerated`; edit a user message replaces later turns.
    45. [D] History reopen + delete → `ai.conversation_delete` without title.
    46. [D] View-as: history readable, send refused with the View-as message, delete refused, settings read-only.
    47. [D] Untick viewer in allowed roles → hidden for viewer; assistant off → non-managers see nothing, managers see set-up state.
    48. [D] Share enquiry details (acknowledged) → quote stats reply shows first names only; spam enquiries not counted. `yarn jobs:retention --dry-run` prints the AI line and `media files due:`.
  - **Phase 10 — Activity and notifications**
    49. [D][M] Owner bell shows a new quote and contact; badge clears on open, dots stay; items open the detail pages. A spam submission never appears.
    50. [D] SMTP pointed at a dead host + quote → "An enquiry email didn't send" for owner and intake, not marketer.
    51. [D] Intake: no CAPI items, no Activity log, `/dashboard/activity` → no-access. Marketer: no enquiry items.
    52. [D] Owner viewing as intake: bell opens without error toast, intake unread count survives, quote/service edit refused with "View-as is read-only. Stop viewing as to make changes." and no row.
    53. [D][M] Activity: quote edit diff shows `[not recorded]` for notes; service edit "Changes"; filters Person/Action/Entity/From–To Irish days; CSV `activity-YYYY-MM-DD.csv` + `audit.export` row; theme publish + AI settings rows have no key/ciphertext; `?page=999` clamps, filter change resets to page 1, Back steps pages; media writes under View-as refused and `media.*` rows listed.
  - **Phase 11 — Parity pass**
    54. [D] Spam: fill the hidden `website` field via devtools on the quote form → success screen; row under Spam tab "Hidden field filled in"; no email, no bell item. Submit within 3 s of load → Spam "Submitted too quickly". "Not spam" → back in inbox + bell, no email. "Mark as spam" on a quote with an invoice number → refused toast.
    55. [D][M] Spam tab on quotes (inbox + table) and contacts with counts; kanban never shows spam; status/source pills MK style; empty lists show the empty state.
    56. [D][M] Dashboard as owner: greeting by Irish time, View site, New enquiries + SEO health KPIs, Enquiries this week chart, Next up checklist, Team activity, Content health, then the full VANTAGE block (6 KPIs, 6-month chart, channels, recent leads). As marketer: MK cards only, no names or money in the page source. As intake: pipeline block, no Team activity.
    57. [D] Quotes "Export CSV" downloads `quotes-YYYY-MM-DD.csv` without spam rows, Activity has `quote.export`; contacts likewise. Privacy request: Download data for a seeded email → JSON with both kinds; Erase (retype email) → contact and unpaid quote gone, paid quote kept and listed; Activity `privacy.erase` with counts only. Intake/marketer: buttons hidden; View-as owner: Erase disabled.
    58. [D] Author: New project saves as draft, not featured; edits own draft; editor's project has no edit link and a devtools PATCH → 403 "Authors can only add and edit their own draft projects."; no create on services/testimonials/home panels; Users & roles matrix shows `own` cells that now match behaviour.
    59. [D][M] Footer, header and contact page phone links use `tel:+353…` (E.164); WhatsApp link opens `wa.me`.
    60. [D] Identity → Lottie file > 2 MB → "Animations can be up to 2 MB" at once.
    61. [D] Content tables (services, projects, testimonials, partner logos, pillars, catalogs, steps) and users: MK pills + empty states; reorder and enable still work.
    62. [D] Legacy: `yarn legacy:check` on dev → `OK`; a project created before Stage A with legacy-only images shows no broken image (check passes only because none exist); tag `p11-pre-legacy-removal` exists; `chore/p11-drop-legacy` guard test proven on a throwaway DB.
    63. [M] Every route in Task 20's list as owner and intake: no horizontal scroll, inbox list → detail → Back works, kanban scrolls inside the board, dialogs fit, View-as banner does not cover actions.
    64. [D] Core features unchanged: quote inbox + kanban drag with status/assignee/inspection date/estimate/payment/invoice/notes, New enquiry dialog, contact inbox + notes, home tabs reorder/enable, services/projects CRUD + reorder + publish/featured + before/after + gallery, insurance/about/process forms, users invite/role/ban/View-as.

---

## Parked-item ledger (every "→ P11 / Phase 11 / parked" item)

| Source | Item | Decision |
| --- | --- | --- |
| P4 ruling + P10 M-3 | Spam status, honeypot, Mark as spam, notify skip | **Do** — T9, T14 (delivery-failed liveness already excludes spam) |
| P9 ledger | SSRF DNS-rebinding on openai-compatible base URL | **Do** — T4 |
| P4 M6 + T1/T2 reports | Single source of default copy; delete `*-page/defaults.ts` | **Do** — T6 |
| P4 final | e164 `tel:` links | **Do** — T16 |
| P3 exit, P4 final | Mobile layout check | **Do** — T20 |
| P4 T4 | Lottie 2 MB check only on submit | **Do** — T16 |
| P2 T2 / global constraints | Author "own projects" (matrix says `own`, not enforced) | **Do** — T10 |
| P5 M1 | Save-vs-delete media race | **Do** — T15 |
| P5 M2 | Replaced/deleted files stay public | **Do** — T11 |
| P5 M5 | Legacy image previews in admin forms | **Drop** — Stage A runs only after `legacy:check` = OK, so no legacy ref reaches a form; a preview would put the Cloudinary cloud name back in the client bundle |
| P5 M7 | OG image not cropped | **Drop** — closed by P6 `assertShareImage` (≥ 1200×630 at 1.91:1) + generated cards; only the legacy path remained (P6 M6) |
| P5 M8 | Uploads buffer the whole body | **Do** — T11 admission gate |
| P5 parked minors (retention shadow name, `removeAll` total, `row!`) | — | **Closed** in P5-T6 (`row!` gone, verified) |
| P8 M-c | `text-brand` contrast on `#131313` | **Do (partly)** — T5 error text + `brand-mid` check; eyebrows kept (Figma, pixel-identical rule) |
| P8 M-g | All font variables on every page | **Drop** — CSS weight only, downloads lazy (`preload:false`); the site theme picks fonts at runtime; splitting next/font per route group gains a few KB; MK same |
| P8 M-e | Admin light/dark live preview | **Do** — T5 |
| P8 M-b | Draft cookie lifetime | **Do** — T5 |
| P8 ledger | Live `/uploads` CSP check | **Do** — exit item 9 |
| P6 M2 | Cached 301 after toggle-off | **Do** — T2 |
| P6 M3 | Hit inflation via public `/resolve` | **Do** — T2 |
| P6 T3 park | Inactive-row repoint | **Drop** — re-activation already runs `createRedirect`, which flattens and loop-checks the row; inactive rows never serve |
| P6 M6 | Legacy OG crop | **Drop** — Stage A (T19) removes the legacy share image path |
| P6 M7 / §6 gap 2 | Per-entry sitemap `lastModified` | **Do** — T2 |
| P6 §6 gap 1 | MK branded per-page OG card | **Do** — T3 |
| P6 §6 gap 7 | Legacy `metaTitle`/`metaDescription`/`ogImage` + `withLegacyMeta` | **Do** — T19 |
| P6 §6 gaps 3–5 | Registry H1/link checks; record SEO tabs; 404 rewrite | **Drop** — P6 rulings 1, 5 and Controller call 5 (code-route pages, no public detail routes, Next 404s) |
| P5 T7, P2 T1 | Drop `*_public_id`, Cloudinary fallback, `res.cloudinary.com`, `assigned_admin_id` | **Do** — T18/T19 (Stage A), T21 (Stage B, owner-gated) |
| P9 M1 / P6 T4 | Flaky assistant lazy timing test | **Do** — T7 |
| P10 M-4 | `auditRoute` load-failure untested | **Do** — T7 |
| P10 M-4 | `delivery_failed` 500-row paging cap | **Drop** — documented tradeoff; a bell feed never needs >500 failed sends |
| P10 T6 | Activity `?page=999` clamp etc. | **Do** — exit item 53 |
| P10 M-2, P9 M6 | Shared `VIEW_AS_READ_ONLY` | **Closed** — one definition (`view-as.ts:6`), verified |
| P9 M3 | `ai_messages(created_at)` index | **Drop** — tables are tiny (90-day purge); add when it grows |
| P9 M5, M7 | Prompt text in audit diff; shared replies on reopen | **Drop** — admin-authored text; the person's own past replies (history to the model already excludes them) |
| P3 T1 | Build CSS test vacuous without built chunk | **Drop** — exit runs it after `yarn build` with `CHECK_BUILD_CSS=1` |
| P3 T2 | Any-of cast; near-circular `reachableLinks` test | **Drop** — cosmetic; nav/route-permission tests cover behaviour |
| P3 T5 | StatusPill/EmptyState unused; source `capitalize`; `KpiRowSkeleton` cols | **Do** — T14, T17, T12 |
| P4 T3 | `ui.remove` without `try/finally` | **Do** — T7 |
| P4 T5 | Stored `page.home` with <4 badges drifts | **Drop** — schema requires exactly 4 and the migration writes 4; unreachable |
| P4 M8, M9 | Lossy repairs bypass gate; `s-maxage` on public settings GET | **Closed by T19** (fallback removed; `no-store`) |

## Parity sweep (MK `~/ireland/james-whitfield` vs VANTAGE, 2026-10-22)

| Area | MK | VANTAGE | Gap → task |
| --- | --- | --- | --- |
| Navigation registry | `lib/admin/nav.ts` | `src/lib/admin/nav.ts` | none (groups, labels, dock, Help, Account match; MK-only Insights/Collections/Newsletter/Design are spec non-goals) |
| Dashboard | `admin/modules/dashboard/{dashboard-view,present}.tsx`, `server/modules/dashboard/service.ts`, `admin/components/dashboard/{pill-bar-chart,activity-feed}.tsx` | `src/features/dashboard-overview/components/dashboard-overview-view.tsx`, `src/server/services/analytics-service.ts` | greeting, View site, week chart, Next up, Team activity, Content health missing; pipeline data sent to every role → T12 |
| Enquiries | `admin/modules/leads/{leads-view,lead-drawer,privacy-request-dialog}.tsx`, `server/modules/leads/{submit,stamp,dsar,csv}.ts` | `src/features/{quote-requests,contact-messages}/**`, `src/server/api/{quote-requests,contacts}.ts` | spam folder/model → T9, T14; Export CSV + Privacy request → T13; StatusPill → T14; lead timeline dropped (Controller call 7) |
| Content lists | MK collections (StatusPill, EmptyState, DataTable) | `src/features/*/components/list/*-table.tsx` | pills + empty states → T17 |
| Users & roles | `admin/modules/users/*`, `lib/auth/matrix.ts` | `src/features/users/**`, `src/lib/auth/matrix.ts` | logic identical; `own` cells unenforced → T10; table pills → T17 |
| SEO | `app/og/[[...path]]/route.tsx`, `server/modules/seo/og.tsx` | `src/app/og/route.tsx` | per-page card → T3; redirects/sitemap hardening → T2 |
| Settings pages | `app/(admin)/admin/(panel)/settings/*` | `src/app/(main)/(protected)/(dashboard_layout)/dashboard/settings/*` | none (labels differ only where MK is clinic-specific) |
| AI assistant | `admin/modules/ai/*` | `src/features/ai/**` | none in UI; SSRF hardening → T4; flaky test → T7 |
| Activity, notifications | `admin/modules/{activity,notifications}` | `src/features/{activity,notifications}` | none (spam exclusion already in feed) |
| Appearance | `admin/modules/appearance/*` | `src/features/appearance/**` | live mode preview, draft exit → T5 |
| Media | `admin/modules/media/*` | `src/features/media/**` | purge + admission → T11; race → T15 |
| Account, auth screens | `admin/modules/{account,auth}` | `src/features/{account,auth}` | none |
| Mobile | MK responsive shell | VANTAGE shell untested <1440 | T20 |
