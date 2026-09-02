# VANTAGE — Setup Plan (Vertical Phases)

Each phase produces a working, verifiable slice — not a horizontal layer. Build → verify → next.

## Phase 0 — Scaffold app

- `create-next-app@latest` in place (TS, App Router, Tailwind, ESLint, `src/` dir, `@/*` alias)
- `shadcn@latest init --pointer`
- Verify: `yarn dev` boots, default page renders
- Verify: `components.json` has `"pointer": true`

## Phase 1 — Tooling & env

- Prettier + lint-staged (`references/prettier.md`)
- Husky + commitlint (`references/husky.md`)
- `.env.local` / `.env.example` populated per brief.md
- Verify: `git commit` triggers hooks; lint/format run clean

## Phase 2 — Folder skeleton + core lib

- Full `src/` tree (app route groups, `server/`, `features/`, `components/`, `lib/`, `hooks/`, `types/`, `validations/`)
- Core lib files: `utils.ts`, `api-routes.ts`, `app-routes.ts`, `types/index.ts`, `ProviderWrapper.tsx`, `LoadingOverlayProvider.tsx`
- `src/lib/font.ts` extracted from generated `layout.tsx`
- Verify: `yarn build` passes with skeleton in place

## Phase 3 — Backend vertical slice: health check

- Hono mount (`app/api/[[...route]]/route.ts`), response envelope, `ApiError`, error/logger/rate-limit middleware
- `src/server/db/index.ts` + `drizzle.config.ts` (Neon EU)
- `GET /api/v1/health` — static response, **no DB call**
- Verify: `curl localhost:3000/api/v1/health` → success envelope

## Phase 4 — Auth vertical slice

- `src/server/middleware/auth.ts`, `src/server/api/auth.ts`
- Session from signed token (no per-request DB lookup)
- `proxy.ts` (Next 16 middleware replacement) — cookie/redirect only, matcher excludes static assets
- Protected route group `(protected)` + `unauthorized` page
- Verify: unauthenticated hit to protected route redirects; `/api/health` still DB-free

## Phase 5 — Caching + Cloudinary stubs

- `src/lib/cache/tags.ts`, tag invalidation pattern, HTTP cache headers
- Cloudinary skipped per brief (revisit when media needed)
- Verify: no polling anywhere (`refetchInterval`, cron, short `revalidate`) — grep clean

## Phase 6 — Frontend slices: theme toggle + TanStack Query

- Theme provider wired into `ProviderWrapper.tsx`
- TanStack Query provider + example `hooks/api/query` hook against `/api/v1/health`
- Verify: toggle works, query hook fetches health check client-side

## Phase 7 — SEO baseline

- Root `metadata` + `metadataBase`, `viewport` export
- `app/sitemap.ts`, `app/robots.ts` (guarded on `VERCEL_ENV`)
- Static `opengraph-image.png`, `JsonLd` (Organization + WebSite)
- Protected layout → `noindex`
- Verify: marketing routes build as static (`○`) not dynamic (`ƒ`)

## Phase 8 — Deploy readiness

- `vercel.json` region `dub1`, `src/lib/env.ts` validation, security headers
- Neon console: suspend timeout = minimum, min compute = 0.25 CU, max 1-2 CU (manual, tell user)
- Final checklist from skill (build passes, static routes correct, no secrets under `NEXT_PUBLIC_`, migrations run against EU branch)

---

**Execution note:** phases 0-3, 5-7 done in this session (health check verified at `/api/v1/health`,
`yarn build`/`lint`/`tsc --noEmit` all pass, marketing routes render static). Phase 4 (auth vertical
slice) and Phase 8 (deploy readiness — Neon/Vercel dashboards, real secrets) are follow-up work, each
a self-contained vertical slice safe to pick up independently.
