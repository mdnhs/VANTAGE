# Admin MK Parity — Phase 8: Appearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MK's Appearance screen in VANTAGE: theme engine (`src/lib/theme/*`), draft → publish with history / reset / discard / restore / preview on site, an **Admin** tab with full MK admin theming applied server-side to the admin frame, and a **limited Site** tab (brand red family + heading/body font) applied to the public site through CSS variables whose defaults reproduce today's site pixel-for-pixel.

**Architecture:** Port MK (`/Users/nazmulhasansourab/ireland/james-whitfield`) `lib/theme/{color,derive,tokens,presets,schema,site,admin,css,checks}.ts`, `server/modules/theme/{service,routes}.ts`, `server/modules/preview/routes.ts`, `app/(admin)/_frame/{admin-frame,default-mode}.tsx`, `admin/modules/appearance/*`, `admin/modules/pages/{use-autosave.ts,conflict-dialog.tsx,preview-pane.tsx}` into VANTAGE folders (`src/lib/theme`, `src/server/{services,api,queries}`, `src/features/appearance`, `src/components/admin/autosave`). The site half is re-based on VANTAGE: base table = today's red family, fixed dark surfaces, plus a curated next/font font pair. One settings row `key = 'theme'` (Phase 1 `settings` table, which already has the `draft` jsonb column) holds `{site, admin}`; revisions via `src/server/lib/revisions.ts`; audit via `audit()`. Default theme emits **no CSS at all** (MK Ruling R4), so default pages are byte-identical.

**Tech Stack:** culori 4.0.2 (+ @types/culori 4.0.1), react-colorful 5.8.1 (MK's pins), zod v4, Hono, Drizzle, react-query, Next 16.3 `'use cache'` + `cacheTag` + `draftMode()`, next/font/google, Tailwind v4 `@theme`, next-themes, sonner, vitest (+ happy-dom).

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§2 goal 7, §5.2 "Branding → Appearance › Brand assets", §6) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md` (Phase 8) · **Format model:** phase-4-settings plan.

## Global Constraints

- Branch `feat/admin-mk-parity`; each task runs in its own git worktree (Phase 3 setup, own test DB `vantage_<slot>_test`); stage only named files (`git add <paths>`, never `-A`).
- **Runs in parallel with Phases 5, 7, 9, 10** (separate worktrees). Every edit to a file another phase may also touch is listed in **Shared files** below; Tasks 5–6 (public site) are **late tasks**: the controller starts them only after Phase 7's marketing-layout/component edits are merged into the branch.
- **DB migrations: none.** `settings.draft` (jsonb) already exists (`src/server/db/schema/settings.ts`). Do not run `yarn db:generate` in this phase; if a reviewer believes a column is missing, stop and ask the controller.
- Pixel-identical defaults: with no `theme` row (or the default theme published) every public page has the same computed colours, shadows, filters and font families as before Phase 8, and the admin is byte-identical (no `<style id="theme-tokens">` emitted).
- Site theming is **limited** (owner decision খ): only `brand`, `brand-hover`, `brand-soft`, `brand-mid`, `brand-pale`, the glow channel (`--brand-rgb`) and the two font slots. Every other public colour stays hard-coded as the Figma build.
- Site token defaults (copied from today's marketing code): `brand #dc2626`, `brand-hover #b91c1c`, `brand-soft #fca5a5`, `brand-mid #f0605f`, `brand-pale #ffd9d9`, `--brand-rgb: 220 38 38`; fonts heading = Manrope (`--font-manrope`), body = Inter (`--font-inter`).
- Admin defaults = `src/app/(main)/(protected)/(dashboard_layout)/admin.css` verbatim (light `--primary #dc2626`, dark `--primary #f05252`, radius `0.75rem`), admin preset id `vantage-red`.
- Fonts: curated next/font/google set only, declared at build time in `src/lib/font.ts`; **no runtime Google Fonts fetch** (MK has no font theming at all, so nothing to copy). Non-default fonts `preload: false`, `display: 'swap'`, `adjustFontFallback` left on (metric-matched fallback ⇒ no CLS). Inter/Manrope keep today's options.
- Emitted CSS is rebuilt from validated numbers / catalogue lookups only (MK §10.1); stored strings never reach a `<style>` tag. Colour input accepts only `#rrggbb` or `oklch(L C H)`; stored canonical `oklch()`.
- Admin dark mode unaffected: the user's explicit light/dark choice always wins; admin `mode` default `system` (= today's `defaultTheme`).
- Permissions as already in `src/lib/auth/permissions.ts`: `appearance: ['read','update','publish']` (owner + admin only). View-as is read-only (`notViewingAs`). No permissions.ts edit.
- Editing model = MK Appearance: autosaved draft (`PUT /draft`, debounce, `{version, draft}`), 409 → ConflictDialog (Review / Overwrite), Publish (blocked while any contrast pair fails: "Publishing is blocked until every pair passes."), Discard draft, Reset to preset…, History ("Load into draft"), Preview on site, toasts "Theme published" / "Loaded into the draft" / "Changed by someone else. Their version is loaded.".
- Cache: public reads `'use cache'` + `cacheTag(settingTag('theme'))` + `cacheLife('max')`; publish invalidates that tag only (same helper globals-service uses); draft saves invalidate nothing (draft-mode requests bypass the cache, per `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` §Draft Mode).
- Read `node_modules/next/dist/docs/01-app/02-guides/draft-mode.md` and `.../04-functions/io.md` before writing Task 2/5 code.

## Shared files (controller sequences these)

| File                                                       | Task | Edit                                                                                                                                      |
| ---------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `yarn.lock`                                | 1    | add `culori@4.0.2`, `react-colorful@5.8.1`, dev `@types/culori@4.0.1` (Phase 9 also adds deps: re-run `yarn install` after merge)         |
| `src/server/api/index.ts`                                  | 2    | `.route('/admin/theme', adminTheme)`, `.route('/preview', preview)`                                                                       |
| `src/lib/routes/api-routes.ts`                             | 2    | `theme: {detail, draft, publish, reset, discard, revisions, restore(rev)}`, `preview: {enter(path), exit(path)}`                          |
| `src/app/(main)/(protected)/(dashboard_layout)/layout.tsx` | 3    | render `<AdminThemeStyle />` + `<DefaultMode />` inside `data-admin-root` (Phases 9/10 may add sheet/bell here)                           |
| `src/lib/admin/coming-soon.ts` (+ `coming-soon.test.ts`)   | 4    | add `'/dashboard/appearance'` to `REAL_ROUTES`; drop `appearance` from the coming-soon test list (Phases 5, 10 add their own routes here) |
| `src/lib/admin/nav.ts`                                     | 4    | appearance `keywords` += `'fonts'`, `'dark mode'` only                                                                                    |
| `src/app/globals.css`                                      | 5    | new `@theme` block (site brand + font tokens) and `--brand-rgb` in `:root`; nothing else                                                  |
| `src/lib/font.ts`                                          | 5    | curated fonts + `SITE_FONT_VARIABLES`                                                                                                     |
| `src/app/layout.tsx`                                       | 5    | `<html className>` += `SITE_FONT_VARIABLES`                                                                                               |
| `src/app/(marketing)/layout.tsx`                           | 5    | mount `<SiteThemeStyle />`; `font-[family-name:var(--font-inter)]` → `font-site-body` (after Phase 7)                                     |
| Marketing components (list in Task 6)                      | 6    | hard-coded red/font → tokens (after Phase 7)                                                                                              |

Not touched: `permissions.ts`, `src/server/db/schema/index.ts`, `src/lib/content/globals.ts` (theme is **not** a `GLOBALS` key — see Rulings), `src/features/globals/global-ui.ts`, `admin.css`.

## Concurrency

Task 1 → Task 2 → {Task 3, Task 4, Task 5} may run concurrently (disjoint files) → Task 6 after Task 5. Tasks 5 and 6 additionally wait for Phase 7's merge.

## Rulings (my calls)

1. `theme` lives in `settings` (key `'theme'`) but has its own schema (`src/lib/theme/schema.ts`), service and API (as MK); it is not added to `GLOBALS`/`EDITABLE_GLOBAL_KEYS`, so the generic globals editor, migration and shared `globals.ts` stay untouched.
2. Site tab has **no preset gallery** (owner limited it): Brand colour, "Advanced" locks for hover/soft/mid/pale, glow follows brand (not lockable), heading/body font pickers, contrast panel, preview pane. "Reset to preset…" always resets the site half to the VANTAGE default; the chosen preset applies to the admin half. Admin presets: `vantage-red` (default, = admin.css) + MK's `evergreen, teal-sage, ocean, plum, terracotta, graphite` (MK `admin.primary` values).
3. Glows (`rgba(220,38,38,A)`) become `rgb(var(--brand-rgb)/A)` so computed values stay `rgba(220, 38, 38, A)` exactly; opacity variants (`bg-[#dc2626]/10`) become Tailwind modifiers on the token (`bg-brand/10`, same `color-mix` output).
4. Site contrast pairs (fixed surfaces, VANTAGE is dark): `#ffffff` on `brand` 4.5; `#ffffff` on `brand-hover` 4.5; `brand` on `#131313` 3 (large accent words, dots, rings); `brand-soft` on `#131313` 4.5 (form error text). Defaults pass (4.83 / 6.49 / 3.85 / 9.8).
5. Admin pairs = MK `ADMIN_PAIRS` except `primary` on `sidebar` min **3** (VANTAGE red #dc2626 on #f2f3f2 is 4.34:1; used for active icon/indicator, WCAG 1.4.11). Any other default failure found by the "default has no issues" test is handled the same way (lower to the class the default meets, comment why) — never change a colour.
6. Draft theme reaches the public site only with Next's draft-mode cookie (`__prerender_bypass`, unforgeable, set only by `GET /preview` behind `appearance.read`). `isEnabled` is read inside the `'use cache'` reader (allowed by Next 16); no session lookup on public requests (differs from MK `isPreviewing()`, which needs `cookies()` and would make the marketing shell dynamic). Draft colours are not sensitive.
7. Theme `<style>` scopes: site `:root`; admin `:root:has([data-admin-root])` and `:root:has([data-admin-root]).dark` (VANTAGE's admin.css selectors; MK used `[data-theme="admin"]`).
8. Fonts catalogue (both slots choose from it; all variable Google fonts): `inter` Inter `--font-inter`, `manrope` Manrope `--font-manrope`, `plus-jakarta-sans` Plus Jakarta Sans `--font-jakarta` (existing admin font), `montserrat` `--font-montserrat`, `dm-sans` `--font-dm-sans`, `space-grotesk` `--font-space-grotesk`, `outfit` `--font-outfit`, `sora` `--font-sora`. All variables sit on `<html>` so a `:root` override resolves.
9. Brand assets card (spec §5.2) on Appearance edits `site.logo` and `site.favicon` through the existing globals API (live on save, `GLOBAL_ACCESS.site`), reusing the schema-form image widget so Phase 5's media-picker swap applies automatically. Lottie logo stays in Identity; hero media stays in Home page.
10. No OG/email theming (MK `/colors` endpoint and `og-theme` not ported): OG image and email templates keep fixed colours.
11. Dead marketing files (not imported anywhere): `hero-section.tsx`, `services-section.tsx`, `testimonials-section.tsx`, `service-split-card.tsx`. Their hex/rgba/font literals are converted like the rest (cheap, keeps the guard simple) but their Tailwind palette classes `red-500`/`red-700` are left alone. Deleting them is Phase 11's call.
12. Admin-side reds in `src/features/{quote-requests,contact-messages,dashboard-overview}` (status colours, `text-[#dc2626]` in quote-detail-view) are admin UI, not site theming — out of scope.

## Review Focus

1. Default theme (no row, or default published) emits `""` for both site and admin CSS and no `<style>` tag → public/admin byte-identical. → Task 1 `css.test.ts`, Task 3/5 render tests, Task 6 computed-style diff.
2. A hostile or drifted stored value (`brand: "#fff;}</style><script>"`, unknown font id, `oklch(9 9 9)`) never reaches CSS and never crashes a page: schema rejects on write (422), reader falls back to defaults on drift. → Task 1 + Task 2 tests.
3. Two admins editing: stale `version` on draft/publish/reset/discard/restore → 409 with `current.updatedBy`; UI shows ConflictDialog, never silently overwrites. → Task 2 + Task 4 tests.
4. A brand colour that is hard to read (e.g. `#ffd400` → white text 1.5:1) blocks publish server-side with "Some colours are too hard to read. …" and "Fix automatically" clears it. → Task 1 + Task 2 tests.
5. A user who picked Dark (or Light) keeps it after an admin `mode` default is published; a user who never chose follows the published default. → Task 3 DefaultMode tests.

---

### Task 1: Theme engine (pure, isomorphic)

**Files:** Create `src/lib/theme/{color,derive,tokens,presets,fonts,schema,site,admin,css,checks}.ts` + `{color,site,admin,css,checks,presets}.test.ts`; Modify `package.json`, `yarn.lock` (deps above). Port from MK `lib/theme/*` and `tests/css/theme-presets.test.ts`; `color.ts`, `derive.ts` verbatim.
**Interfaces (Produces):**

- `color.ts`: `Oklch`, `parseColor(s): Oklch|null`, `formatOklch(c)`, `toHex(c)`, `contrast(a,b)`, `onColor(bg)`, `nudge(moving, fixed, min)`, `scale(c)`, `sameColor`, `fit`.
- `tokens.ts`: `SITE_TOKENS = ['brand','brand-hover','brand-soft','brand-mid','brand-pale'] as const`, `SiteToken`, `LOCKABLE_SITE_TOKENS` (all but `brand`), `ADMIN_TOKENS` (MK list verbatim), `AdminToken`.
- `presets.ts`: `PRESET_IDS = ['vantage-red','evergreen','teal-sage','ocean','plum','terracotta','graphite']`, `PresetId`, `SITE_THEME_DEFAULTS: Record<SiteToken,string>` (hex above), `VANTAGE_ADMIN: {radius: 0.75, light: Record<AdminToken,string>, dark: Partial<…>}` (admin.css verbatim), `PRESETS: Record<PresetId,{label, admin:{primary}}>` (`vantage-red` → `#dc2626`, label "Vantage red").
- `fonts.ts`: `SITE_FONT_IDS`, `SiteFontId`, `SITE_FONTS: Record<SiteFontId,{label, variable}>` (Ruling 8), `DEFAULT_FONTS = {heading:'manrope', body:'inter'}`.
- `schema.ts`: `ColorValue`, `SiteTheme = {brand: ColorValue|null=null, tokens: partialRecord(LOCKABLE_SITE_TOKENS, ColorValue)={}, fonts:{heading,body}}`, `AdminTheme` (MK verbatim, `preset` default `'vantage-red'`), `ThemeConfig`, `ThemeConfigValue`, `SiteThemeConfig`, `AdminThemeConfig`, `DEFAULT_THEME`, `ADMIN_RADII`, `parseTheme(value: unknown): ThemeConfigValue` (safeParse; on failure `console.warn` + `DEFAULT_THEME`).
- `site.ts`: `resolveSiteTokens(site): Record<SiteToken,Oklch>` (non-brand tokens = MK `shift(default, defaultBrand, brand, true)`; locks win), `SITE_DEFAULT`, `brandRgb(site): [r,g,b]` (from `toHex(brand)`), `defaultSiteTheme()`.
- `admin.ts`: `buildAdminTokens(admin, mode)`, `ADMIN_DEFAULT`, `presetAdminColours(id)` — MK logic over `VANTAGE_ADMIN`.
- `css.ts`: `SCOPES = {site: ':root', admin: ':root:has([data-admin-root])', adminDark: ':root:has([data-admin-root]).dark'}`, `toCss(selector, tokens, extra)`, `siteThemeCss(site): string` (changed colour tokens as `--color-<token>`, `--brand-rgb:R G B` when brand changed, `--font-site-heading|body:var(<catalogue variable>)` when ≠ default), `adminThemeCss(admin)`, `liveDeclarations(admin, mode)`.
- `checks.ts`: `SITE_SURFACE = '#131313'`, `ON_BRAND = '#ffffff'` (pseudo-tokens `'surface'` / `'on-brand'` in issues; never moved by fixes — the brand token moves), `SITE_PAIRS: [SiteToken|'on-brand', SiteToken|'surface', 3|4.5][]`, `ADMIN_PAIRS` (Rulings 4–5), `ContrastIssue`, `PairRating`, `pairRatings`, `checkTheme`, `describeIssue`, `fixIssue`, `fixAll`, `tokenLabel` (site labels: Brand, Brand hover, Error text, Gradient mid, Gradient end; fixed: "Text on brand", "Page background").

- [ ] **Step 1: Write failing tests**
  - `color.test.ts`: `parseColor('#dc2626')` → `formatOklch` → `toHex` round-trips to `#dc2626`; rejects `'red'`, `'var(--x)'`, `'#dc2626;}'`, `'rgb(1,2,3)'`, 65-char strings.
  - `presets.test.ts`: every `--<token>: #hex` in admin.css `:root:has([data-admin-root]) {…}` equals `VANTAGE_ADMIN.light[token]`, every one in the `.dark` block equals `VANTAGE_ADMIN.dark[token]` (parse the CSS file text; `--radius` → `0.75`).
  - `site.test.ts`: `resolveSiteTokens(DEFAULT_THEME.site)` → `toHex` equals `SITE_THEME_DEFAULTS`; brand `#2563eb` moves `brand-hover` by the same hue delta; locked `brand-hover` wins; `brandRgb(DEFAULT_THEME.site)` = `[220,38,38]`.
  - `css.test.ts`: `siteThemeCss(DEFAULT_THEME.site) === ''`; `adminThemeCss(DEFAULT_THEME.admin) === ''`; brand `#2563eb` → string starts `:root{--color-brand:oklch(` and contains `--brand-rgb:37 99 235`, no `--font`; `fonts.heading 'sora'` only → exactly `:root{--font-site-heading:var(--font-sora)}`; admin `preset 'ocean'` → contains both `:root:has([data-admin-root]){` and `:root:has([data-admin-root]).dark{`; radius `1` → `--radius:1rem`; `toCss` drops a token name `'x;}'`.
  - `checks.test.ts`: `checkTheme(DEFAULT_THEME)` → `[]`; brand `#ffd400` → issue `{scope:'site', text:'on-brand', surface:'brand'}`; `fixAll` result has no issues and keeps fonts; `describeIssue` floors (`4.499` → `"4.49"`); admin primary `#fde047` → admin-light issue, `fixIssue` darkens primary.
  - `schema` (in `css.test.ts`): `ThemeConfig.safeParse({site:{brand:'#fff;}</style>'}})` fails; `{site:{fonts:{heading:'comic-sans'}}}` fails; `parseTheme({site:{brand:42}})` → `DEFAULT_THEME`.
- [ ] **Step 2:** `yarn vitest run src/lib/theme` → FAIL (modules missing).
- [ ] **Step 3:** `yarn add culori@4.0.2 react-colorful@5.8.1 && yarn add -D @types/culori@4.0.1`; implement the files (MK ports; site derivation per Interfaces).
- [ ] **Step 4:** `yarn vitest run src/lib/theme` → PASS; `yarn tsc --noEmit` clean.
- [ ] **Step 5:** Commit `feat(theme): add theme engine with VANTAGE site and admin tables`.

### Task 2: Theme service, API, draft preview, cached readers

**Files:** Create `src/server/services/theme-service.ts`, `src/server/api/admin-theme.ts`, `src/server/api/preview.ts`, `src/server/queries/get-theme.ts`, `src/lib/theme/preview-path.ts`, `tests/integration/theme-api.test.ts`, `tests/integration/theme-queries.test.ts`; Modify `src/server/api/index.ts`, `src/lib/routes/api-routes.ts` (shared).
**Interfaces:**

- Consumes: Task 1 `ThemeConfig`, `parseTheme`, `checkTheme`, `describeIssue`, `presetAdminColours`, `defaultSiteTheme`; `settings` table; `writeRevision/listRevisions/findRevision` (`entityType 'setting'`, `entityId 'theme'`); `conflictError(conflictCurrent(db,row))`; `audit()`; `topLevelDiff`; `settingTag`.
- Produces: `ThemeDoc = {value, draft, hasDraft, version, updatedAt, issues}`; `getThemeAdmin()`, `saveThemeDraft(actor,{version,draft})`, `publishTheme(actor,{version})`, `resetThemeDraft(actor,{version,preset,scope:'site'|'admin'|'both'})`, `discardThemeDraft(actor,{version})`, `themeRevisions()`, `restoreThemeRevision(actor, revisionId, version)` (MK `server/modules/theme/service.ts` semantics: draft saves not audited and no revision; publish = value←draft, draft←null, revision note `"Published theme"`, audit `appearance.publish` with diff, invalidate tag; reset/discard/restore write the draft and audit `appearance.reset|discard|restore`; restore of a revision whose `entityId ≠ 'theme'` → 404 "That version doesn't exist"). Reset `site` scope → `defaultSiteTheme()`; admin scope → `{...current.admin, ...presetAdminColours(preset)}` (radius/mode kept).
- Routes `/admin/theme`: `GET /` (`appearance.read`), `PUT /draft`, `POST /reset`, `POST /discard`, `POST /revisions/:rev/restore` (`appearance.update`), `POST /publish` (`appearance.publish`), `GET /revisions` (`appearance.read`); every mutation `notViewingAs('View-as is read-only: the theme cannot be changed')`; `ok()` envelope.
- Routes `/preview`: `GET /?path=` (`can({appearance:['read']})`, `(await draftMode()).enable()`, 307 to path); `GET /exit?path=` (no auth, disable, 307; invalid path → `/`). `PreviewPath` = zod string, `^/(?!/)[A-Za-z0-9/_-]*$`, max 200.
- `get-theme.ts`: `getPublishedTheme(): Promise<ThemeConfigValue>` and `getSiteThemeForRender(): Promise<{site: SiteThemeConfig; preview: boolean}>` — both `'use cache'`, `cacheTag(settingTag('theme'))`, `cacheLife('max')`; the second reads `(await draftMode()).isEnabled` and returns `parseTheme(row.draft)` when enabled and a draft exists.

- [ ] **Step 1: Write failing tests** (`theme-api.test.ts`, seeded roles as in `globals-api.test.ts`):
  - owner `GET` on empty DB → `{version:0, hasDraft:false, issues:[]}` and `value` deep-equals `DEFAULT_THEME`; editor/marketer/viewer/intake/author → 403.
  - admin `PUT /draft` v0 → version 1, `hasDraft:true`, no audit row, no revision; stale v0 again → 409 with `current.updatedBy` = admin's name; `draft.site.brand:'red'` → 422.
  - `POST /publish` with draft brand `#ffd400` → 422 `VALIDATION_FAILED`, message starts `"Some colours are too hard to read."`; with brand `#b91c1c` → `value.site.brand` canonical oklch, `draft` null, one revision note `"Published theme"`, one audit `appearance.publish` with `diff.site`.
  - `POST /reset {preset:'ocean', scope:'admin'}` → `draft.admin.preset 'ocean'`, `draft.site` unchanged, radius/mode kept; `scope:'site'` → `draft.site` = default.
  - `POST /discard` → `hasDraft:false`; audit `appearance.discard`.
  - restore: published revision → loaded into `draft`, `value` unchanged, audit `appearance.restore`; random uuid → 404; a `page.home` revision id → 404.
  - view-as session → mutations 403 with the read-only message.
  - drift: insert `settings` row `{key:'theme', value:{site:{brand:42}}}` → `GET` returns `DEFAULT_THEME`.
  - preview: owner `GET /preview?path=/services` → 307 `location: /services` + `set-cookie` contains `__prerender_bypass`; editor → 403; `path=//evil.com` → 422; `GET /preview/exit?path=//x` → 307 to `/`.
  - `theme-queries.test.ts` (mock `next/headers` `draftMode`, `next/cache`): draft disabled → published site; enabled + draft row → draft site and `preview:true`; enabled + no draft → published.
- [ ] **Step 2:** `yarn vitest run --project integration tests/integration/theme-*.test.ts` → FAIL.
- [ ] **Step 3:** Implement service, routes, mounts, `API_ROUTES.theme` / `API_ROUTES.preview`, readers.
- [ ] **Step 4:** Same command → PASS; `yarn tsc --noEmit`, `yarn lint` clean.
- [ ] **Step 5:** Commit `feat(theme): add theme draft/publish API and draft preview`.

### Task 3: Admin frame applies the published admin theme

**Files:** Create `src/features/appearance/components/admin-theme-style.tsx` (server), `src/features/appearance/components/default-mode.tsx` (client, port MK `default-mode.tsx`) + `default-mode.test.tsx`, `admin-theme-style.test.tsx`; Modify dashboard `layout.tsx` (shared).
**Interfaces:** Consumes `getPublishedTheme()`, `adminThemeCss()`. Produces `<AdminThemeStyle />` (renders `<style id="theme-tokens">{css}</style>` or `null`; takes optional `theme` prop for tests) and `<DefaultMode mode />`; `AUTO_MARKER_KEY = 'vantage-admin-theme-auto'`, storage key = next-themes default `'theme'`.

- [ ] **Step 1: Write failing tests:** `AdminThemeStyle` with `DEFAULT_THEME` → renders nothing; with admin preset `ocean` → one `style#theme-tokens` whose text equals `adminThemeCss(...)`. `DefaultMode` (happy-dom, mocked `useTheme`): storage empty → `setTheme('dark')` and marker `'dark'`; stored `'light'`, no marker → `setTheme` not called and marker removed; stored `'system'` = marker `'system'`, new mode `'light'` → `setTheme('light')`; `localStorage` throwing → no crash.
- [ ] **Step 2:** `yarn vitest run src/features/appearance` → FAIL.
- [ ] **Step 3:** Implement; in the dashboard layout add `getPublishedTheme()` to the existing `Promise.all`, render `<AdminThemeStyle theme={theme} />` and `<DefaultMode mode={theme.admin.mode} />` as the first children of `<div data-admin-root>`.
- [ ] **Step 4:** Tests PASS; `yarn tsc --noEmit`; existing `admin-css*.test.ts` still pass.
- [ ] **Step 5:** Commit `feat(theme): apply published admin theme in the dashboard frame`.

### Task 4: Appearance page (Site + Admin tabs, draft workflow, history, brand assets)

**Files:** Create `src/app/(main)/(protected)/(dashboard_layout)/dashboard/appearance/page.tsx` (`requirePermission({appearance:['read']}, '/dashboard/appearance')`, MK PageHeader); `src/components/admin/autosave/{use-autosave.ts,use-autosave.test.ts,conflict-dialog.tsx}` (port MK `admin/modules/pages/*`, using VANTAGE `GlobalApiError`-style error with `status`/`current`); `src/features/appearance/{services/api.ts, hooks/api/query/{use-theme,use-theme-revisions}.ts, hooks/api/mutation/{use-publish-theme,use-reset-theme,use-discard-theme,use-restore-theme}.ts, utils/query-keys.ts, lib/live-tokens.ts(+test), components/{appearance-view,site-controls,admin-controls,colour-field,contrast-panel,preset-gallery,font-picker,admin-preview,site-preview-pane,theme-history,brand-assets,reset-dialog}.tsx, components/appearance-view.test.tsx}`; Modify `coming-soon.ts` + test, `nav.ts` keywords (shared).
**Interfaces:** Consumes Task 1 engine, Task 2 routes via `API_ROUTES.theme`, `useSaveGlobal('site')`/`useGlobal('site')` + schema-form image widget (Ruling 9), `usePermission`/actor context, `PageHeader`, sonner. Produces `useAutosave<T>({version, delay, save}) → {state, schedule, flush, reset, overwrite, exclusive, getVersion}` (MK contract) and `applyLive(root, decls) → cleanup`.

- Layout/copy as MK `appearance-view.tsx` (Rulings 2, 9): header actions Preview on site · Discard draft · Reset to preset… · Publish (only with `appearance.publish`); status line "Saving…/Unsaved changes/Couldn't save/Changed by someone else/Draft saved/No draft changes"; Site tab = "Site colours" card (Brand `ColourField`, `<details>` "Advanced tokens" with lock toggles for the 4 lockable tokens, glow swatch read-only) + "Fonts" card (two selects listing `SITE_FONTS`, each option sample-rendered with `font-family: var(<variable>)`) + `ContrastPanel scope="site"` + `SitePreviewPane` (iframe `API_ROUTES.preview.enter('/')`, reloads on `state.savedAt`); Admin tab = MK `AdminControls` (preset gallery, Primary, Accent, Neutral tint, Corner radius `ADMIN_RADII`, Default mode) + `ContrastPanel scope="admin"` + `AdminPreview` (live tokens via `useLiveAdmin`); below: Brand images card + History card ("Load into draft", "Nothing published yet.").

- [ ] **Step 1: Write failing tests:**
  - `use-autosave.test.ts` (port MK): debounce coalesces two `schedule` calls into one save; 409 → `state.status 'conflict'` with `current`; `overwrite()` resaves with the server's version; `exclusive` waits for an in-flight save.
  - `live-tokens.test.ts` (port MK): sets only `--[a-z][a-z0-9-]*` names inline on the element; cleanup restores previous inline values.
  - `appearance-view.test.tsx` (happy-dom, mocked fetch): renders "Site"/"Admin" tabs and "Publish"; draft brand `#ffd400` → alert "Publishing is blocked until every pair passes." and Publish disabled; actor without `appearance.update` → controls `fieldset` disabled; Publish success → toast "Theme published"; publish 409 → toast "Changed by someone else. Their version is loaded." and refetch; History "Load into draft" posts to restore and toasts "Loaded into the draft"; font picker change schedules a draft with `site.fonts.heading`.
  - `coming-soon.test.ts`: `/dashboard/appearance` is in `REAL_ROUTES` and not in `comingSoonParams()`.
- [ ] **Step 2:** `yarn vitest run src/features/appearance src/components/admin/autosave src/lib/admin` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Tests PASS; `yarn tsc --noEmit`, `yarn lint` clean.
- [ ] **Step 5:** Commit `feat(admin): add Appearance page with site and admin theming`.

### Task 5: Public site wiring — tokens, fonts, theme style, preview bar (LATE: after Phase 7 merge)

**Files:** Create `src/features/appearance/components/{site-theme-style.tsx,preview-bar.tsx}` (+ `site-theme-style.test.tsx`), `src/lib/theme/site-css-parity.test.ts`, `src/lib/theme/fonts-registry.test.ts`, `scripts/theme/computed-style-snapshot.js` (browser snippet), `scripts/theme/diff-computed-styles.ts` (+ `.test.ts`); Modify `src/app/globals.css`, `src/lib/font.ts`, `src/app/layout.tsx`, `src/app/(marketing)/layout.tsx` (all shared).
**Interfaces:** Consumes `getSiteThemeForRender()`, `siteThemeCss()`, `SITE_FONTS`. Produces Tailwind utilities `bg|text|border|ring|outline|fill|from|via|to|selection:bg-{brand,brand-hover,brand-soft,brand-mid,brand-pale}` (with `/NN` modifiers), `font-site-heading`, `font-site-body`, CSS var `--brand-rgb`; `SITE_FONT_VARIABLES: string` (space-joined `.variable` classes of all catalogue fonts) from `src/lib/font.ts`; `<SiteThemeStyle />` (`'use cache'` component: `<style id="theme-tokens">` when non-empty, plus `<PreviewBar />` when `preview`); `<PreviewBar />` (fixed bottom pill "Previewing the draft theme" + link "Exit preview" → `API_ROUTES.preview.exit(pathname)`).

- `globals.css`: new block after the admin `@theme`:
  ```css
  /* Public brand family + fonts (Appearance › Site). Defaults = the Figma build; the
     site theme <style> overrides them on :root only when they differ. */
  @theme {
    --color-brand: #dc2626;
    --color-brand-hover: #b91c1c;
    --color-brand-soft: #fca5a5;
    --color-brand-mid: #f0605f;
    --color-brand-pale: #ffd9d9;
    --font-site-heading: var(--font-manrope);
    --font-site-body: var(--font-inter);
  }
  ```
  and `--brand-rgb: 220 38 38;` inside the existing `:root {}` block. Must be plain `@theme` (not `inline`) so utilities reference the variables.
- `font.ts`: add Montserrat, DM_Sans, Space_Grotesk, Outfit, Sora with `variable` per Ruling 8, `subsets: ['latin']`, `preload: false`; Inter/Manrope/Jakarta unchanged.

- [ ] **Step 1: Capture the baseline before any edit.** `yarn build && yarn start`; in a browser run `scripts/theme/computed-style-snapshot.js` on `/`, `/services`, `/our-work`, `/insurance`, `/about`, `/process`, `/contact`, `/get-a-quote` at 1440×900 and 390×844; save JSON to `tmp/theme-baseline/<page>-<w>.json` (not committed). The snippet records, for every element under `body` keyed by DOM path: `color, background-color, background-image, border-{top,right,bottom,left}-color, outline-color, box-shadow, filter, text-decoration-color, fill, stroke, font-family`.
- [ ] **Step 2: Write failing tests:**
  - `site-css-parity.test.ts`: the new `@theme` block's `--color-<token>` values equal `SITE_THEME_DEFAULTS`; `--brand-rgb` in `:root` equals `brandRgb(DEFAULT_THEME.site).join(' ')`; `--font-site-heading`/`body` equal `var(<SITE_FONTS[DEFAULT_FONTS.*].variable>)`; the block is not `@theme inline`.
  - `fonts-registry.test.ts`: for each `SITE_FONTS` entry, `src/lib/font.ts` source declares `variable: '<variable>'`; every non-default entry has `preload: false`; `src/app/layout.tsx` uses `SITE_FONT_VARIABLES` in the `<html>` className.
  - `site-theme-style.test.tsx`: default → renders nothing; brand `#2563eb` → `style#theme-tokens` text = `siteThemeCss(...)`; `preview:true` → "Exit preview" link with `/api/v1/preview/exit?path=`.
  - `diff-computed-styles.test.ts`: identical snapshots → exit 0, empty report; one changed `background-color` → exit 1 and the report names the DOM path and both values.
- [ ] **Step 3:** `yarn vitest run src/lib/theme src/features/appearance scripts/theme` → FAIL.
- [ ] **Step 4:** Implement. Marketing layout: render `<SiteThemeStyle />` as the wrapper `div`'s first child; replace `font-[family-name:var(--font-inter)]` with `font-site-body`; keep `manrope.variable inter.variable` on the div.
- [ ] **Step 5:** Tests PASS; `yarn tsc --noEmit`, `yarn lint`, `yarn build` OK; snapshot `/` and `/contact` again and diff against baseline → no differences (components are not converted yet; this proves the new tokens/fonts/style change nothing by themselves).
- [ ] **Step 6:** Commit `feat(theme): wire site theme tokens, fonts and draft preview into the public site`.

### Task 6: Marketing components → brand tokens (LATE: after Task 5 and Phase 7)

**Files:** Modify exactly these (re-run the grep in Step 1 first; if Phase 7 added a file with brand literals, include it and tell the controller):
`src/app/(marketing)/page.tsx`, `src/app/(marketing)/insurance/page.tsx`, `src/components/marketing/{contact-form,contact-info,coordination-section,heritage-section,hero-section,insurance-cta,partner-logos-strip,portfolio-filters,project-grid,quote-form,service-feature-block,service-split-card,services-section,standards-section,stitch-case-studies,stitch-cta,stitch-estimator,stitch-header,stitch-hero,stitch-pillars,stitch-process,stitch-services,stitch-social-proof,team-section,testimonials-section,visit-us-section}.tsx`, `src/components/marketing/ui/landing-primitives.tsx`. Create `src/components/marketing/brand-tokens.test.ts` and `src/lib/theme/site-css-build.test.ts` (opt-in, modelled on `admin-css-build.test.ts`).
**Interfaces:** Consumes Task 5 utilities. Mapping (every variant prefix — `hover:`, `focus-visible:`, `group-hover:`, `selection:`, `md:` — is kept as is):

| Before                                                            | After                        |
| ----------------------------------------------------------------- | ---------------------------- |
| `{bg,text,border,ring,outline,fill,from}-[#dc2626]` (incl. `/NN`) | `{…}-brand` (same `/NN`)     |
| `…-[#b91c1c]`                                                     | `…-brand-hover`              |
| `text-[#fca5a5]`                                                  | `text-brand-soft`            |
| `via-[#f0605f]`                                                   | `via-brand-mid`              |
| `to-[#ffd9d9]`                                                    | `to-brand-pale`              |
| `rgba(220,38,38,A)` inside `shadow-[…]` / `drop-shadow-[…]`       | `rgb(var(--brand-rgb)/A)`    |
| `font-[family-name:var(--font-manrope)]`                          | `font-site-heading`          |
| `font-[family-name:var(--font-inter)]`                            | `font-site-body`             |
| `MapMarker color='#dc2626'` (inert: custom element)               | `color='var(--color-brand)'` |

- [ ] **Step 1: Write the failing guard test** `brand-tokens.test.ts`: reads every `.tsx/.ts` under `src/components/marketing` and `src/app/(marketing)` and expects no match for `/#(dc2626|b91c1c|fca5a5|f0605f|ffd9d9)\b/i`, `/rgba\(\s*220\s*,\s*38\s*,\s*38/`, `/var\(--font-(inter|manrope)\)/`; also asserts each mapped utility class it finds (`bg-brand`, `font-site-heading`, …) is one Task 5 declared (guards typos such as `bg-brand-hovr`).
- [ ] **Step 2:** `yarn vitest run src/components/marketing/brand-tokens.test.ts` → FAIL listing files.
- [ ] **Step 3:** Apply the mapping file by file (no other class changes, no reformatting beyond Prettier).
- [ ] **Step 4:** Guard PASS; `marketing-chrome.test.tsx` and all unit tests PASS; `yarn tsc --noEmit`, `yarn lint` clean.
- [ ] **Step 5: Build CSS check** `site-css-build.test.ts` (opt-in `CHECK_BUILD_CSS=1`, after `yarn build`): built CSS contains `--color-brand:#dc2626`, a rule `.bg-brand{background-color:var(--color-brand)}`, `.font-site-heading{font-family:var(--font-site-heading)}`, and no `bg-\[\#dc2626\]` selector. Run `yarn build && CHECK_BUILD_CSS=1 yarn vitest run site-css-build` → PASS.
- [ ] **Step 6: Pixel parity.** `yarn start`; re-run the snapshot on all 8 pages × 2 widths; `yarn tsx scripts/theme/diff-computed-styles.ts tmp/theme-baseline tmp/theme-after` → exit 0. Spot-check hover/focus on the header CTA, form submit and portfolio filter in the browser (hover colour `#b91c1c`, ring `#dc2626`).
- [ ] **Step 7: Theming works.** In the admin (owner) set brand `#2563eb` + heading `sora`, Preview on site: buttons/accents/glows blue, headings Sora, no layout shift visible; Publish; public `/` shows it without preview; Reset site → Publish → diff against baseline exit 0 again.
- [ ] **Step 8:** Commit `feat(theme): route marketing brand colours and fonts through theme tokens`.

### Phase exit check

- [ ] `yarn tsc --noEmit`, `yarn lint` 0 errors, `yarn test` green, `yarn build` OK, `CHECK_BUILD_CSS=1 yarn vitest run admin-css-build site-css-build` green.
- [ ] Controller browser check: Appearance as owner (publish, discard, reset, history load, conflict from a second tab, preview on site + Exit preview), as admin, as editor (no Appearance in sidebar, `/dashboard/appearance` → no-access); admin light + dark unchanged with the default theme; user-chosen dark persists after publishing `mode: light`; computed-style diff of all public pages vs baseline empty with the default theme; Lighthouse CLS on `/` ≤ 0.01 with heading font `sora` published (then reset).
