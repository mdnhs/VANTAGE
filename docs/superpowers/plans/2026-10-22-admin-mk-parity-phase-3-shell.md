# Admin MK Parity — Phase 3: Admin Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put every VANTAGE admin screen inside MK's admin shell — admin tokens and type scale, floating icon-collapsible sidebar driven by a nav registry, 72 px topbar (search pill ⌘K, AI slot, enquiries link, notifications, user menu), footer dock + website card, global section rail, command palette with server search, MK dashboard kit and page header, in-panel no-access / coming-soon / account pages, sonner toasts — without changing any screen's behaviour.

**Architecture:** Port MK (`/Users/nazmulhasansourab/ireland/james-whitfield`) `lib/admin/nav.ts`, `admin/components/{shell,command,dashboard}/*`, `app/(admin)/admin.css` tokens, `app/(admin)/admin/(panel)/{layout,no-access,[section]/[[...rest]],account}` into VANTAGE (`src/lib/admin/nav.ts`, `src/components/admin/{shell,command,dashboard}/*`, `src/app/(main)/(protected)/(dashboard_layout)/**`). Admin tokens are scoped so the public marketing site is untouched.

**Tech Stack:** Next 16.3 App Router, shadcn base-nova on @base-ui/react, Tailwind v4, cmdk 1.1.1, sonner (MK pin), next-themes, react-query, nuqs.

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§2 goal 1, §5.2, §5.7) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md`

## Global Constraints

- Branch `feat/admin-mk-parity`; stage only files your task names; never `git add -A`. Read `node_modules/next/dist/docs/` before Next APIs. yarn v1; pin MK's exact versions (cmdk 1.1.1, sonner and any other MK-used package at MK's version).
- Visual parity with MK: copy MK class strings, sizes and copy verbatim (sidebar 20rem floating `p-4`, group labels `h-7 px-3 text-[11px] font-semibold tracking-wider uppercase`, nav button `h-10 rounded-xl text-[15px]`, active bar `h-8 w-1 rounded-r-full bg-primary`, topbar `h-[72px] rounded-card bg-sidebar`, rail `lg:w-52`, content surface `rounded-card bg-sidebar p-4 sm:p-6 lg:p-8`, desktop breakpoint `lg` / 1024 px).
- Admin tokens = MK `admin.css` (type scale `--text-title`, `--text-card-title`, `--text-kpi`, `--radius-card: 1.375rem`, neutrals, success/warning/danger/skeleton, `bg-hero`, `bg-promo`, `bg-hatch`) **with VANTAGE brand primary** instead of MK green: light `--primary #dc2626`, `--primary-foreground #ffffff`, `--accent #fdecec`, `--accent-foreground #7f1d1d`, `--ring #ef4444`, charts red family `#b91c1c #dc2626 #ef4444 #7f1d1d #fca5a5`, hero gradient `#3a0d0d→#7f1d1d`, promo `#120707→#3a0d0d`, hatch `#f4a3a3`; dark `--primary #f05252`, `--primary-foreground #1a0505`, `--accent #3a1414`, `--ring #f87171`, hatch `#7f1d1d`. Admin font Plus Jakarta Sans (next/font), mono Geist Mono.
- Scoping: tokens apply only when the admin shell is mounted — selector `:root:has([data-admin-root])` (+ `.dark` variant) so portals (dialogs, popovers, toasts) inherit them; the public site and auth screens keep current tokens.
- Behaviour of every existing screen (quotes inbox/kanban, contacts, dashboard overview data, website page forms, services/projects CRUD, settings tabs, users & roles) is unchanged; only chrome, headers and routing wrappers change.
- URLs stay under `/dashboard/*`. Page guards keep using `requirePermission(permissionFor(path))`; denial now redirects to `/dashboard/no-access?from=<path>` (in-panel) instead of `/unauthorized` for signed-in admins; role `user`/anonymous still → `/login`.
- No new runtime behaviour for AI or notifications in this phase: AI sparkle button renders disabled-with-tooltip "AI assistant is coming soon" (Phase 9), notifications popover shows MK's empty state (Phase 10).

## Review Focus

1. A role sees a nav item it cannot open, or ⌘K offers a destination it cannot open → must never happen (registry filtered by `hasPermission`; search API filtered server-side). → Task 2 + Task 4 tests.
2. Deep links to child screens (e.g. `/dashboard/services/abc/edit`, `/dashboard/quotes/123`, `/dashboard/homepage-pillars/create`) highlight the right sidebar item and rail tab. → Task 2 `isActivePath`/`activeSection` tests.
3. Public marketing pages after this phase look pixel-identical (admin tokens leak) → Task 1 check: `/` computed `--primary`/font unchanged.
4. Collapsed sidebar (icon rail) and mobile (< 1024 px sheet) keep every destination reachable, including dock items and sign-out. → Task 3 test of dock link list + controller browser check.
5. Permission denial inside the panel shows the no-access page with "Back to the dashboard", never a blank page or loop. → Task 6 test.

---

### Task 1: Admin tokens, font, UI primitives, sidebar component port

**Files:** Create `src/app/(main)/(protected)/(dashboard_layout)/admin.css` (imported by the dashboard layout), Modify `src/lib/font.ts` (+ `jakarta` Plus Jakarta Sans `--font-jakarta`), `src/components/ui/sidebar.tsx` + `src/hooks/use-mobile.ts` (MK customisations: `lg` breakpoint, `MOBILE_BREAKPOINT = 1024`, floating panel `group-data-[variant=floating]:rounded-card` no ring/shadow, ⌘B ignored in editable targets); Add shadcn/base-nova components MK uses and VANTAGE lacks: `command`, `popover`, `sonner`, `kbd`, `empty`, `item`, `spinner`, `radio-group`, `toggle`, `toggle-group` (via `npx shadcn add` with the project's `components.json`, then align with MK's versions of those files); `package.json` (`cmdk`, `sonner`).
**Interfaces — Produces:** CSS utilities `rounded-card`, `text-title`, `text-card-title`, `text-kpi`, `bg-hero`, `bg-promo`, `bg-hatch`, colour tokens `success(-soft)`, `warning(-soft)`, `danger(-soft)`, `skeleton`; marker attribute `data-admin-root` (consumed by Task 3); `useIsMobile()` at 1024.

- [ ] Step 1: Unit test `src/hooks/use-mobile.test.ts` (1023 → mobile, 1024 → desktop) and a CSS test `src/app/(main)/(protected)/(dashboard_layout)/admin-css.test.ts` that reads `admin.css` and asserts every required token/utility name exists and all token blocks are under `:root:has([data-admin-root])`.
- [ ] Steps 2–4: RED, implement, GREEN; `yarn build`.
- [ ] Step 5: Commit `feat(admin): add MK admin tokens, font and UI primitives`.

### Task 2: Nav registry

**Files:** Create `src/lib/admin/nav.ts`, `src/lib/admin/nav.test.ts`, `src/components/admin/shell/nav-icons.ts`; Modify `src/lib/admin/route-permissions.ts` (derive the base page permissions from the registry; keep pattern rows for `create` / `[id]/edit` / `[id]` detail routes) + its test.
**Interfaces — Produces:** MK types (`NavGroupId`, `NavLink`, `NavItem`, `Destination`, `NAV_GROUPS`) with VANTAGE extension `match?: readonly string[]` (extra path prefixes counted as "inside" this link) and `permission` single `Permissions`; `NAV`, `HELP_LINK`, `EXTRA_LINKS`; helpers `visibleNav(roles)`, `reachableLinks(roles)`, `linkForPath(path)`, `isActivePath(pathname, link)`, `activeSection(pathname, roles)` (item with >1 visible child whose href or child hrefs/match prefixes contain the path), `firstReachableHref(item, roles)`.
Registry (ids · group · href · permission · children):

- `dashboard` · menu · `/dashboard` · `dashboard[view]`.
- `website` · menu · label "Website" · permission `page[read]` · children: `website-home` "Home page" `/dashboard/home-page` `page[read]` match `/dashboard/homepage-pillars`, `/dashboard/homepage-catalogs`, `/dashboard/homepage-process-steps`, `/dashboard/testimonials`, `/dashboard/partner-logos`; `website-services` "Services" `/dashboard/services` `content[read]`; `website-work` "Our work" `/dashboard/projects` `content[read]`; `website-insurance` "Insurance" `/dashboard/insurance` `page[read]`; `website-about` "About" `/dashboard/about` `page[read]`; `website-process` "Process" `/dashboard/process-page` `page[read]`. Parent href resolves to `firstReachableHref`.
- `media` · menu · `/dashboard/media` · `media[read]`.
- `enquiries` · menu · label "Enquiries" · badge `new-leads` · permission any of quote/contact read (registry supports `permission` as `Permissions | Permissions[]` any-of — extend `hasPermission` usage accordingly) · children: `enquiries-quotes` "Quote requests" `/dashboard/quotes` `quote[read]`; `enquiries-contacts` "Contact messages" `/dashboard/contacts` `contact[read]`.
- `seo` · growth · `seo[read]` · children Overview `/dashboard/seo`, Defaults `/dashboard/seo/defaults`, Redirects `/dashboard/seo/redirects` (`redirect[read]`).
- `marketing` · growth · `tracking[read]` · children Tracking `/dashboard/marketing`, Consent banner `/dashboard/marketing/consent`, Event catalogue `/dashboard/marketing/events`, Custom code `/dashboard/marketing/code` (`code[update]`).
- `appearance` · general · `/dashboard/appearance` · `appearance[read]`.
- `settings` · general · "Site settings" · `/dashboard/settings` · `settings[read]` (children arrive in Phase 4).
- `users` · general · "Users & roles" · `/dashboard/users` · `user[list]` · dock.
- `activity` · general · "Activity log" · `/dashboard/activity` · `audit[read]` · dock.
- `HELP_LINK` `/dashboard/help` `dashboard[view]`; `EXTRA_LINKS` Account `/dashboard/account` `dashboard[view]`.
  Keywords as MK where an MK equivalent exists, plus VANTAGE terms (quotes: "estimate, leads, kanban"; website: "pages, content, homepage").
- [ ] Step 1: Tests: per role (all 8 incl. `user`), `visibleNav` contains exactly the items/children their permissions allow; `reachableLinks` never includes an href whose permission fails; `isActivePath`/`activeSection` for deep links (Review Focus 2) incl. `/dashboard/homepage-pillars/x/edit` → website-home, `/dashboard/quotes/123` → enquiries-quotes, `/dashboard` only exact; every registry href passes `permissionFor` with an equal permission; `firstReachableHref(website, intake)` is null.
- [ ] Steps 2–4: RED, implement, GREEN. Step 5: commit `feat(admin): add nav registry`.

### Task 3: Shell (sidebar, topbar, dock, website card, section rail, toaster)

**Files:** Create `src/components/admin/shell/{admin-shell,app-sidebar,nav-entry,format-badge,website-card,footer-dock,topbar,notifications-button,user-menu,section-rail,brand-mark,constants}.tsx|ts` (+ `format-badge.test.ts`, `footer-dock.test.tsx` via `renderToStaticMarkup`), `src/features/enquiries/hooks/use-new-enquiries-count.ts`; Modify `src/app/(main)/(protected)/(dashboard_layout)/layout.tsx` (MK panel layout: `requireActor`, read `sidebar_state` cookie for `defaultOpen`, `<div data-admin-root className={jakarta…}>`, `ActorProvider`, `AdminShell`, `ViewAsBanner`, sonner `<Toaster position="top-center"/>`), `dashboard/(site)/layout.tsx` (remove the left SiteSectionNav aside — the global rail replaces it); Rename `src/components/layout/section-tabs.tsx` → `src/components/layout/page-tabs.tsx` (`PageTabs`, update its 3 users); Delete `src/components/layout/sidebar/**`, `site-nav-items.ts`, `site-section-nav.tsx`, `theme-toggle.tsx` if unused.
**Interfaces — Consumes:** Task 2 registry; `useActor`, `useCan` (`src/contexts/actor-provider.tsx`); `useSignOut` (`src/features/auth/hooks/use-sign-out.ts`); site settings (business name, logo/Lottie) passed from the layout to `BrandMark`; site URL `NEXT_PUBLIC_APP_URL`.
**Produces:** `AdminShell({ defaultOpen, siteUrl, brand, children })`; badge count = `quote.new` (if `quote[read]`) + `contact.new` (if `contact[read]`) from existing stats endpoints, `refetchInterval: 60_000`, `refetchOnWindowFocus: true` (per-query override of the global client).

- MK component contents/classes verbatim; MK `WebsiteCard` swirl art replaced by a neutral `bg-promo` card (MK art is client-specific); user menu items: Account → `/dashboard/account`, Security → `/dashboard/account?tab=security`, theme radio, Sign out; topbar AI slot disabled with tooltip (Global Constraints); enquiries mail link → `/dashboard/quotes` when `quote[read]`, else `/dashboard/contacts` when `contact[read]`, hidden otherwise.
- [ ] Step 1: Tests: `formatBadge`; dock renders Users & roles / Activity log only when permitted plus Help + Log out (Review Focus 4); section rail shows Website children for a path under `/dashboard/services/...` and nothing on `/dashboard`.
- [ ] Steps 2–4: RED, implement, GREEN; `yarn build`; every existing dashboard page still renders (controller browser check after the task).
- [ ] Step 5: Commit `feat(admin): add MK admin shell`.

### Task 4: Command palette + admin search API

**Files:** Create `src/components/admin/command/{palette-context,use-command-hotkey,search-pill,command-palette,actions}.tsx|ts` (+ tests for `isPaletteShortcut`, `buildActions` filtering), `src/lib/search/normalize.ts` (+ test), `src/server/api/admin-search.ts` (mount `/admin/search`), `src/server/services/admin-search-service.ts`, `tests/integration/admin-search.test.ts`.
**Interfaces:** `GET /api/v1/admin/search?q=` — `can({ dashboard: ['view'] })`, zod `q` trim max 100 default '', `actorLimit` 30 / 10 s; response `{ items: { id: 'nav:<id>', kind: 'page', label, href }[] }` built from `reachableLinks(actor.roles)` matched on label, parent, keywords (child label `Parent › Child`). Palette groups "Go to" and "Actions" (no Articles group — VANTAGE has none); actions: theme light/dark/system, open site, sign out.

- [ ] Step 1: Tests: intake searching "seo" gets nothing; marketer gets SEO + Marketing children but not Custom code; owner "quote" → Quote requests; normalise strips diacritics; ⌘K/Ctrl+K detection ignores alt/shift and repeats.
- [ ] Steps 2–4: RED, implement, GREEN. Step 5: commit `feat(admin): add command palette and admin search`.

### Task 5: Dashboard kit + page headers on every screen

**Files:** Create `src/components/admin/dashboard/{page-header,kpi-card,status-pill,empty-state,skeletons,dashboard-card,format}.tsx|ts`, `src/components/admin/titled-section.tsx` (+ `format.test.ts`, `status-pill.test.ts`); Modify every dashboard page/view to open with `PageHeader` (title, description, primary/secondary actions using `PRIMARY_ACTION`/`SECONDARY_ACTION`) replacing ad-hoc headers — quotes, quote detail, contacts, contact detail, dashboard overview, home page, services list/create/edit, projects list/create/edit, testimonials/partner-logos/pillars/catalogs/process-steps create/edit, insurance, about, process page, settings, users; `features/dashboard-overview` KPI tiles → `KpiCard`, sections → `DashboardCard`, loading → `KpiRowSkeleton`/`CardSkeleton` (charts and data unchanged); `(dashboard_layout)/loading.tsx` + `(site)/loading.tsx` use the MK skeletons; replace inline success notices in users & roles with `toast` (sonner) where MK uses toasts.

- [ ] Step 1: Tests for `formatNumber`/`formatPercent`/`formatDelta`/`relativeTime` and `toneForStatus` (VANTAGE quote/contact statuses map: new→info, contacted/waiting_response/quote_sent→warning, approved/in_progress→info, completed/replied→success, cancelled/archived→neutral).
- [ ] Steps 2–4: RED, implement, GREEN; `yarn build`; no data-hook or mutation changes (diff touches only presentational code).
- [ ] Step 5: Commit `feat(admin): apply MK page headers and dashboard kit to all screens`.

### Task 6: No-access, coming-soon, account, error pages

**Files:** Create `dashboard/no-access/page.tsx`, `dashboard/[section]/[[...rest]]/page.tsx` (MK coming-soon for registry hrefs without real routes: media, seo/_, marketing/_, appearance, activity, help), `dashboard/account/page.tsx` + `src/features/account/components/{account-view,profile-card,password-card,two-factor-card,sessions-list}.tsx` (+ hooks/services on `/api/v1/account/sessions` and Better Auth `updateUser` / `changePassword`), `dashboard/not-found.tsx`, `dashboard/error.tsx`; Modify `src/server/lib/auth/session.ts` (`requirePermission` → `/dashboard/no-access?from=<safeNext path>`), `src/lib/admin/route-permissions.ts` (account, no-access, coming-soon hrefs), `/two-factor-setup` back/finish links → `/dashboard/account?tab=security`; tests.

- [ ] Step 1: Tests: `requirePermission` denial redirects to `/dashboard/no-access?from=…` for an admin and to `/login` for role `user` (Review Focus 5); no-access page resolves the label via `linkForPath`; coming-soon page 404s for unregistered sections and enforces the link's permission; account change-password enforces 12 chars (server already does) and shows the server error.
- [ ] Steps 2–4: RED, implement, GREEN; `yarn build`.
- [ ] Step 5: Commit `feat(admin): add no-access, coming-soon and account pages`.

### Phase exit check

- [ ] `yarn tsc --noEmit` (ignore generated `LayoutProps`), `yarn lint` 0 errors, `yarn test` green, `yarn build` OK.
- [ ] Controller browser check (desktop 1440 + mobile 390, light + dark): owner sees full MK shell; collapse to rail; ⌘K search; section rail on Website/Enquiries; viewer & intake nav; no-access page; account page; public `/` unchanged.
