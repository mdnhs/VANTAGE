# Task 3 report: MK admin shell

Branch: worktree-agent-a5a4675b30698a672 (base 4605aed). Final SHA: see commit `feat(admin): add MK admin shell` (git log -1).

## Implemented

- `src/components/admin/shell/*`: admin-shell, app-sidebar, nav-entry, format-badge, website-card (neutral `bg-promo`, no swirl), footer-dock, topbar, notifications-button, user-menu, section-rail, brand-mark (logo image / Lottie / glyph + business name), constants.
- `src/components/admin/command/search-pill.tsx`: non-interactive stub (`aria-disabled`), Task 4 replaces it.
- Topbar: AI sparkle button disabled, tooltip "AI assistant is coming soon"; enquiries mail link -> /dashboard/quotes (quote read), else /dashboard/contacts (contact read), else hidden.
- `src/features/enquiries/hooks/use-new-enquiries-count.ts`: quote.new + contact.new, each gated by read permission, same query keys as the stats hooks, `refetchInterval: 60_000`, `refetchOnWindowFocus: true`.
- Dashboard layout: `requireActor`, `sidebar_state` cookie -> `defaultOpen`, `<div data-admin-root className={jakarta.variable + font-sans}>`, `ActorProvider`, `AdminShell`, `ViewAsBanner`, `<Toaster position="top-center"/>`. Brand from `siteSettingsService.getPublic()`, siteUrl from `NEXT_PUBLIC_APP_URL`.
- `dashboard/(site)/layout.tsx`: left SiteSectionNav aside removed (global rail replaces it).
- Renamed `section-tabs.tsx` -> `page-tabs.tsx` (`PageTabs`, `PageTab`); updated 5 users (about form, insurance form, process, services list, projects list) + page-skeleton comment. (Brief said 3; there were 5.)
- Deleted `components/layout/sidebar/**`, `site-nav-items.ts`, `site-section-nav.tsx`, `theme-toggle.tsx` (no remaining users).
- Carried item b: `admin-css-build.test.ts` now runs only with `CHECK_BUILD_CSS=1` (run after `yarn build`: `CHECK_BUILD_CSS=1 yarn vitest run admin-css-build`).

## TDD

RED (`npx vitest run --project unit src/components/admin`): 3 files failed, "Cannot find module './format-badge'" / "./section-rail" / "./footer-dock" (modules not yet written).
GREEN: same command, 4 files passed (15 tests) incl. admin-css-build skipped.

## Verification

- `yarn test` (DATABASE_URL_TEST=...vantage_p3a_test): 49 files passed, 1 skipped; 635 passed, 3 skipped. Green with a fresh `.next` present, CSS test skipped by default.
- `CHECK_BUILD_CSS=1` run after `yarn build`: 3/3 pass.
- `yarn build`: OK. `tsc --noEmit`: only pre-existing generated-type errors (`LayoutProps`, `RouteContext`). eslint --max-warnings=0 clean on touched dirs.
- Smoke on PORT=3101 (owner signed in via curl): /dashboard, /services, /quotes, /home-page, /settings, /users, /contacts all 200 and render `data-admin-root`, skip link, AI assistant, Log out; Website rail present on /services and /home-page. Dev server stopped.

## Concerns / notes

- Not browser-checked visually (collapsed rail, mobile sheet); controller browser check pending.
- Sign-in via curl needed `Origin: http://localhost:3000` (3101 rejected as invalid origin).
- `yarn dev` was started in the worktree; stopped afterwards.
- Dock/`FooterDock` `links` type widened to `NavLink | NavItem` (registry `NavItem.permission` may be an array).
- Shell sub-components import `useActor`/`useCan` from `@/contexts/actor-provider`; AdminShell includes its own `TooltipProvider` (harmless duplicate of the root one).
