# VANTAGE admin — Magda Kennedy parity design

Date: 2026-10-22 · Status: draft for approval

## 1. Intent

The owner wants the VANTAGE admin panel (`/dashboard`) to look, feel and behave like the
Magda Kennedy (MK) admin they already built (`~/ireland/james-whitfield`, package
`magda-kennedy`): same shell and layout, same growth/config features (SEO, Marketing,
Appearance, Site settings, AI assistant, Activity log, Users & roles), same RBAC, and media
on Cloudflare R2 instead of Cloudinary. One consistent admin across their client projects is
the point — they know MK's UX and want VANTAGE's clients to get the same.

**The hard rule (owner's words): VANTAGE's own core features must not be dropped.** Every
current admin capability keeps working, re-housed in the MK shell.

## 2. Goals

1. **MK shell** in VANTAGE: floating icon-collapsible sidebar with MK groups, 72px topbar
   (search pill ⌘K · AI sparkle ⌘J · enquiries mail link · notifications bell · user menu),
   website card + footer dock (Users & roles, Activity log, Help, Log out), global section
   rail for any nav item with >1 child, MK page header + dashboard kit (KPI card, gauge,
   status pill, empty state, skeletons), ⌘K command palette, sonner toasts. Single nav
   registry drives sidebar, ⌘K, rails and page permission guards (MK `lib/admin/nav.ts`).
2. **RBAC exactly like MK**: roles `owner, admin, editor, author, marketer, intake, viewer`,
   statement/role matrix in the style of MK `lib/auth/permissions.ts`, extended with
   VANTAGE resources (see §5.3). Users & roles screen with People/Roles tabs, permission
   matrix (read-only view of role → permissions), invite, change role, ban/unban, view-as
   (impersonation) banner. Owner protection rules as MK.
3. **Demo users, MK style**: a seed script creating one demo account per role
   (7 accounts) for local/staging.
4. **Site settings like MK**: `/dashboard/settings/[slug]` pages — Identity, Contact,
   Navigation, Footer, Forms & microcopy, Notifications, Privacy, AI assistant — using MK's
   GlobalEditor model (live save, optimistic `version` → 409 on conflict, History sheet with
   restore, generic `revisions` table).
5. **SEO like MK**: Overview (health gauge, 8 checks, alt-text card, issues with Fix links),
   Defaults (title template, default meta/OG, robots, verification, business JSON-LD, crawl
   preview robots/sitemap), Redirects (301/302/307/308, hits, active, note), per-page SEO
   tab (SERP preview, social card, live checklist) on every VANTAGE public page and on
   services/projects detail records where pages exist.
6. **Marketing like MK**: Tracking (GTM, GA4, Meta Pixel, encrypted write-only CAPI token,
   test-event, status panel, CAPI test), Consent banner (live preview), Event catalogue,
   Custom code (owner-only, allowlisted hosts, consent category, route patterns, kill switch).
   Public site actually emits the events (`generate_lead` on quote/contact submit,
   `contact_click` on tel/WhatsApp/mailto, `virtual_page_view`).
7. **Appearance like MK**: MK theme engine (`lib/theme/*`: presets, brand colour, tokens,
   contrast checks + auto-fix, draft → publish, history, reset/discard, preview on site),
   Site and Admin tabs, applied server-side to admin frame and public site. **Admin tab** =
   full MK admin theming. **Site tab (owner's choice: limited)** = brand/accent colour (today's
   `#dc2626` red family: base, hover, glow/shadow tints) and the two font families (heading,
   body) only; every other public-site colour stays exactly as the Figma build. The marketing
   components replace their hard-coded red/font values with CSS variables emitted by
   `siteThemeCss`; defaults reproduce the current site pixel-for-pixel.
8. **AI assistant like MK**: Vercel AI SDK, providers Google / Anthropic /
   OpenAI-compatible, right-hand sheet (⌘J), route-context chip, starters, markdown,
   regenerate/edit, stored conversations, read-only tools filtered by permission, settings
   page (provider, encrypted key, model + list models, allowed roles, instructions, max
   tokens, test), rate limit 30 msgs / 10 min / user. VANTAGE tools: `searchContent`,
   `getPage` (site page copy), `getSeoHealth`, `getDashboardSummary`, `getQuoteStats`,
   `getQuoteRequest` (owner-gated detail), `getContactStats`.
9. **Activity log like MK** (`audit_logs` with field diffs, filters, facets, detail sheet,
   Irish time) — written for every admin mutation, including existing VANTAGE ones.
10. **Notifications bell like MK** (poll 60s): new quote request, new contact message,
    CAPI failure, delivery failure.
11. **Email over SMTP (owner's choice, instead of MK's Resend)**: MK's email features —
    invites, set/reset password, email OTP for 2FA, new-lead notifications to recipients,
    optional auto-reply, delivery-failure bell item — sent via SMTP (`nodemailer`), templates
    ported from MK. **If SMTP is not configured the system must still fully work**: no email
    OTP (2FA falls back to authenticator-app TOTP only, or is optional), invites and password
    resets produce a one-time link the admin copies from the UI, notifications are recorded in
    the bell but not emailed, and Settings › Notifications shows an "SMTP not configured"
    state with a Test button once configured.
12. **Media on R2 like MK**: media library (grid, type filter, missing-alt filter, details:
    alt /300, decorative, caption, focal point, usage, replace, soft delete), `media` table
    as MK, content-hashed immutable keys, sharp processing (sniff, orient/strip EXIF, ≤4000px,
    re-encode, blur placeholder, dominant colour). **Same R2 bucket as MK, separate prefix
    `vantage/`** (keys `vantage/media/YYYY/MM/<hash16>-<slug>.<ext>`). Credentials copied
    from MK's `.env` (owner approved). Cloudinary removed entirely.
13. **Migrate existing Cloudinary assets** to R2 with a one-off script and rewrite every
    `*PublicId` reference to a `media` row (FK), including public-form inquiry photos.

## 3. Non-goals

- Moving hosting from Vercel to the VPS (owner will do it; see §5.8 — the build only has to
  be VPS-ready).
- MK's block page-builder, Insights/Articles/Authors, Collections, Newsletter, Design-system
  page. VANTAGE's content stays in its own structured forms.
- Rebuilding the public marketing site design (done separately; only add tracking hooks,
  theme tokens, SEO metadata reads, and R2 image URLs).
- Multi-tenant / shared admin codebase across projects. This is a port, not a library.
- Help centre content (MK itself only has a "Coming soon" page — same here).

## 4. Anti-goals (fails even if it "works")

- Any VANTAGE core admin capability lost or degraded: quote inbox + kanban (dnd-kit) with
  status/assignee/inspection date/estimate/payment/invoice/notes, manual "New enquiry"
  dialog, contact inbox with status tabs + notes, dashboard KPIs + 6-month chart + channel
  breakdown + recent leads, home-page tabs (hero, pillars, catalog, process, testimonials,
  partner logos) with reorder/enable, services/projects CRUD + reorder + publish/featured +
  before/after + gallery, insurance/about/process page forms, admin users.
- Public site images breaking during/after migration (no window where `cldUrl` is gone but
  data still holds Cloudinary ids).
- Secrets visible in client bundles, logs, API responses or the chat (R2 keys, AI keys, CAPI
  token). Write-only + encrypted at rest with `APP_ENCRYPTION_KEY`, as MK.
- VANTAGE keys clobbering MK's objects in the shared bucket (everything under `vantage/`).
- An admin that looks "inspired by" MK rather than the same — spacing, sizes, groups, labels
  follow MK.

## 5. Decisions

### 5.1 Owner's decisions

- Same layout and features as MK (list above); RBAC like MK; demo users MK-style.
- R2 instead of Cloudinary; same bucket as MK, different folder; reuse MK's credentials.
- Keep every VANTAGE core feature.
- Process: superpowers workflow; planning on Opus 5.5, implementation by Sonnet 5.5 subagents.

### 5.2 Information architecture (my call, MK groups + VANTAGE items)

| Group   | Items (children → section rail)                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu    | Dashboard · Website (Home page, Services, Our work, Insurance, About, Process) · Media · Enquiries (Quote requests [inbox/kanban], Contact messages; badge = new)     |
| Growth  | SEO (Overview, Defaults, Redirects) · Marketing (Tracking, Consent banner, Event catalogue, Custom code)                                                              |
| General | Appearance · Site settings (Identity, Contact, Navigation, Footer, Forms & microcopy, Notifications, Privacy, AI assistant) · dock: Users & roles, Activity log, Help |

URLs stay under `/dashboard/*` (no `/admin` rename). Existing "Website pages" second-level
left menu is replaced by the MK global section rail. Existing VANTAGE settings tabs are
redistributed: Business info → Identity, Contact + opening hours + socials → Contact,
Branding (logo/favicon/Lottie/hero media) → Appearance › Brand assets, SEO tab → SEO › Defaults.

### 5.3 RBAC (my call on VANTAGE resource mapping)

MK statement minus `article/collection/newsletter`, plus VANTAGE resources:
`page` (website page copy: home/services/our-work/insurance/about/process heroes & sections),
`content` (services, projects, testimonials, partner logos, pillars, catalog, process steps),
`quote` & `contact` (actions `read, update, export, delete` — MK's `lead`),
plus MK's `dashboard, globals, media, seo, redirect, tracking, code, appearance, settings,
audit, ai, user, session`. Role intent as MK: editor = content/pages/media/SEO; author =
read pages, create/update own projects + media; marketer = SEO/tracking/media, no leads;
intake = leads only; viewer = read-only; admin = all but custom code/impersonating admins;
owner = everything. Existing admins migrate to `owner` (first/super) or `admin`, preserving
access (anyone with ADMINS_MANAGE → owner).

### 5.4 Auth (my call)

Adopt MK's model: admin accounts become Better Auth users with the `admin` plugin
(roles, ban, impersonation) and `twoFactor` (optional, as MK policy). VANTAGE already
ships Better Auth (currently only for site users at `/account`); admin accounts move into it
and the custom `vantage_session` JWT + base64 permission blob are retired after migration.
Site users keep working (role `user`, never allowed into `/dashboard`). The cookie-only
proxy check + server permission guard pattern stays; guards now use the MK role matrix.
Login screen + forgot/reset password + 2FA screens restyled like MK.

### 5.5 Uploads (my call, follows the VPS move)

The owner is moving VANTAGE from Vercel to a VPS, so there is no 4.5 MB body limit: use
**MK's pass-through upload exactly** (multipart POST to the API with XHR progress, server
sniff → sharp process → probe → `PutObject`, 20 MB cap, 2-job concurrency + queue of 8 →
503). No presigned URLs, no bucket CORS. Public-form photos (quote/contact) go through the
same server pipeline (rate-limited, max 4 photos) and become `media` rows linked to the
lead. `MEDIA_DRIVER=local` kept for offline dev, as MK.

**Hero video (my call):** stored on R2 under `vantage/media/...` too, as a `media` row with a
video MIME type, uploaded through the same endpoint but skipping sharp (sniff only; cap
100 MB; `video/mp4` and `video/webm`). The hero form uses the media picker filtered to video.

### 5.6a Production data & cutover (answered from the project)

The live site still runs on Vercel + Neon with real leads (quotes, contacts) and real admins;
local dev already moved to Docker Postgres. Therefore every one-off migration (Cloudinary →
R2 + FK rewrite, settings singleton → key/value, admin_users → Better Auth) is a script with
`--dry-run` and `--verify` modes, idempotent, run first against a fresh copy of production,
with a `pg_dump` backup step documented before the real run. During the transition the
public site must render from either old or new data shape until the switch (no broken
images). Better Auth `users` currently has **0 rows** (no site customers), so admins move in
without collision handling; `/account` site-user login is kept but treated as legacy.
Demo users are seeded only when `SEED_DEMO_USERS=true` (local and any staging), never in
production.

### 5.8 Hosting target: VPS (owner's plan)

Build must be VPS-ready: `output: 'standalone'`, a Dockerfile + compose service alongside the
existing Postgres compose, `sharp` available at runtime, no Vercel-only APIs (`@vercel/*`
runtime features, Vercel cron, Edge). `MEDIA_PUBLIC_URL` feeds `images.remotePatterns` at
build time, as MK. `vercel.json` can stay until the owner switches.

### 5.6 Editing model (my call)

VANTAGE's site-settings singleton (~90 columns) moves to MK's `settings` key/value
(`key`, `value` jsonb, `draft`, `version`, `updatedBy`, `updatedAt`) + `revisions`, one key
per settings page / website page (e.g. `identity`, `contact`, `page.home`, `page.insurance`).
Website page forms get GlobalEditor (live save + history + SEO tab). List-type content
(services, projects, testimonials, …) stays in its tables and existing CRUD screens, re-skinned.
A data migration copies current values; public pages read through the same cached services
(cache tags preserved).

### 5.7 Code organisation (my call)

Follow VANTAGE conventions, not MK's folders: features in `src/features/<x>/{components,
hooks/api,services,types}`, server in `src/server/{api,services,repositories}`, shared pure
libs in `src/lib/{theme,seo,tracking,ai,admin}` (these are ported from MK almost verbatim).
Port MK's schema-form renderer to `src/components/admin/schema-form`. Add shadcn pieces MK
uses that VANTAGE lacks (sonner, command/cmdk, popover, checkbox, form, sheet already).

## 6. Constraints

- Next.js 16.3 (`src/app`, Cache Components on — `cacheComponents: true`; read
  `node_modules/next/dist/docs/` before Next APIs), Hono API at `/api/v1` with the existing
  `ok()` envelope and api → services → repositories layering, Drizzle + `pg` against local
  Postgres (Docker, port 5433), react-query, RHF + zod v4, nuqs, shadcn `base-nova` on
  `@base-ui/react`, Tailwind v4.
- Language/UI copy in English (admin), Irish time for dates as MK.
- New deps allowed: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `sharp`,
  `culori`, `react-colorful`, `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `@ai-sdk/anthropic`,
  `@ai-sdk/openai-compatible`, `cmdk`, `sonner`, `nodemailer` (+ types), MK's email template
  approach (pin exact versions MK uses where possible). No Resend.
- Env: add `MEDIA_DRIVER, MEDIA_LOCAL_DIR, MEDIA_PUBLIC_URL, MEDIA_KEY_PREFIX=vantage,
S3_ACCOUNT_ID, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
APP_ENCRYPTION_KEY (new, VANTAGE-specific — not MK's), AI_PROVIDER_MOCK,
DISABLE_CUSTOM_SCRIPTS, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE,
MAIL_FROM (all optional), SEED_DEMO_USERS`; remove Cloudinary vars at the end.
- Every phase leaves the app working (public site + admin) and typechecks/lints clean.

## 7. Delivery shape (my call; the plan refines it)

1. Foundations: deps, env, R2 storage + media table + library, `settings`/`revisions`,
   audit log writer, crypto/secrets, SMTP mailer with graceful no-SMTP mode, VPS build
   (standalone + Dockerfile).
2. Auth + RBAC: Better Auth admin/2FA, role matrix, migration of admins, demo-user seed,
   Users & roles screen, login screens.
3. Shell: nav registry, sidebar/topbar/dock/section rail/⌘K/page header/toasts; move all
   existing VANTAGE screens into it unchanged in behaviour.
4. Settings + GlobalEditor + history; website-page forms onto settings keys.
5. Media migration Cloudinary → R2; swap every upload field to the media picker; remove
   Cloudinary.
6. SEO. 7. Marketing + public tracking. 8. Appearance + theme application.
7. AI assistant. 10. Activity log UI + notifications bell. 11. Polish/parity pass against MK
   screen by screen.

## 8. Left to the builder

Exact table/column names for migrated settings keys, file splits, test strategy (follow
superpowers TDD where logic is non-trivial: RBAC matrix, theme engine, SEO checks, media
key/processing, audit diff), order of tasks within phases, which MK files are copied
verbatim vs adapted, demo-user names/emails (MK-style, `@vantage.test`, passwords stored in
the seed/example config, never printed in chat).
