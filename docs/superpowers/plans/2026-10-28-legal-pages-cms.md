# Legal Pages CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins create/edit/reorder/publish legal pages (title, slug, Tiptap body) served at `/<slug>`, auto-listed in the footer legal bar and the sitemap.

**Architecture:** New `legal_pages` table → repository → cached service (`cacheTag`/`revalidateTag`, mirrors `service-service.ts`) → Hono routes at `/legal-pages` guarded by `can({ content: [...] })`. Body is Tiptap JSON, validated against a node/mark allowlist on write and rendered to HTML on the server. Public route is a dynamic root segment `src/app/(marketing)/[slug]/page.tsx`; static routes win over it.

**Tech Stack:** Next.js 16.3 (read `node_modules/next/dist/docs/` before touching routing/caching), Hono, Drizzle/Neon, zod 4, vitest, TanStack-Query hooks like `src/features/services`, Tiptap v3 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/html` — check the current major on npm; StarterKit v3 already bundles Link + Underline).

**Spec:** `docs/superpowers/specs/2026-10-28-legal-pages-cms-design.md`

## Global Constraints

- Public URL is `/<slug>` — no `/legal/` prefix.
- Slug: `^[a-z0-9]+(?:-[a-z0-9]+)*$`, max 140; reject `isReservedPath('/'+slug)`, `LIVE_PATHS.has('/'+slug)`, duplicates, and an existing redirect `sourcePath === '/'+slug`. Enforced server-side.
- Only `status === 'published'` rows reach the public page, footer, sitemap.
- Permission: `content` read/create/update/delete; every write route uses `notViewingAs(VIEW_AS_READ_ONLY)`, `auditRoute`, `assertContentWrite` exactly like `src/server/api/services.ts`.
- Allowed Tiptap nodes: `doc, paragraph, text, heading (levels 2–4), bulletList, orderedList, listItem, blockquote, horizontalRule, hardBreak`. Marks: `bold, italic, underline, link`. Link hrefs: `http:`, `https:`, `mailto:`, `tel:`, or site-relative starting with a single `/`. External links render `rel="noopener noreferrer"` `target="_blank"`.
- `publishedAt` ("Last updated") bumps only when a published page's title/content changes, or on draft→published. Reorder and slug-only edits never bump it.
- Published slug rename → 301 redirect `/<old>` → `/<new>` via `createRedirect(tx, …)` in the same transaction.
- Delete is hard delete (admin UI confirms first).
- A DB failure must not be cached as "no pages" (see commit ca23e8a — throw, don't return `[]`).
- Commit messages: conventional commits (commitlint is configured).

## Review Focus

1. Slug equal to an existing marketing route (`about`, `services`, `contact`, …) or a reserved prefix (`dashboard`, `login`, `api`) → 422 with a `slug` field error, not a shadowed page. Test in Task 3.
2. Body containing a `javascript:` link or an unknown node type (e.g. `image`, raw HTML) → rejected on write (422) and, defensively, stripped at render. Tests in Tasks 1 & 4.
3. Draft page requested at `/<slug>` → 404 and absent from footer/sitemap. Tests in Tasks 3 & 5.
4. Renaming a published page's slug to a value that already has a redirect, or back to its own earlier slug (redirect `/b`→`/a` exists, rename `a`→`b`) → handled without a redirect loop: delete the stale redirect whose source equals the new path before saving. Test in Task 3.
5. Footer when the DB read fails → error propagates (no cached empty legal list). Test in Task 2.

---

### Task 1: Schema, migration, validation

**Files:**

- Create: `src/server/db/schema/legal-pages.ts`
- Modify: `src/server/db/schema/index.ts` (add `export * from './legal-pages';`)
- Create: `src/server/db/migrations/00xx_*.sql` via `yarn db:generate`
- Create: `src/validations/legal-page-schema.ts`
- Test: `src/validations/legal-page-schema.test.ts`

**Interfaces:**

- Produces: table `legalPages` (`legal_pages`): `id uuid pk`, `title varchar(160) notNull`, `slug varchar(140) notNull unique`, `content jsonb $type<TiptapDoc>() notNull`, `status varchar(16) notNull default 'draft'` (`'draft' | 'published'`), `displayOrder integer notNull default 0`, `publishedAt timestamptz null`, `createdAt`, `updatedAt`. Index `(status, displayOrder)`. Types `LegalPage`, `NewLegalPage`.
- Produces in `legal-page-schema.ts`: `tiptapDocSchema` (recursive zod, allowlist above), `type TiptapDoc`, `isSafeHref(href: string): boolean`, `createLegalPageSchema` `{ title: 1–160, slug, content: tiptapDocSchema, status?: 'draft'|'published' }`, `updateLegalPageSchema = create.partial()`, `reorderLegalPagesSchema { ids: uuid[] min 1 }`, `legalPageListQuerySchema { page, limit }` (same as services), inferred input types `CreateLegalPageInput`, `UpdateLegalPageInput`, `ReorderLegalPagesInput`, `LegalPageListQuery`. Also `slugify(title: string): string` (lowercase, ASCII-fold, non-alnum → `-`, trim hyphens, max 140).

- [ ] **Step 1: Write failing tests** — `tiptapDocSchema` accepts a doc with heading level 2 + paragraph + bold + `https://` link; rejects `{type:'image'}`, heading level 1, link `javascript:alert(1)`, link `//evil.com`; `isSafeHref('/privacy-policy') === true`, `isSafeHref('mailto:a@b.ie') === true`, `isSafeHref('data:text/html,x') === false`; `slugify('Privacy & Cookie Policy') === 'privacy-cookie-policy'`; `createLegalPageSchema` rejects slug `Privacy_Policy`.
- [ ] **Step 2:** `yarn vitest run src/validations/legal-page-schema.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement schema file + validation file. Reserved/collision checks are NOT in zod (they need the DB) — Task 2 owns them.
- [ ] **Step 4:** Tests PASS. `yarn db:generate` produces one new migration; inspect it creates only `legal_pages` + its index.
- [ ] **Step 5:** Commit `feat(legal-pages): add schema and validation`.

### Task 2: Repository + service

**Files:**

- Create: `src/server/repositories/legal-page-repository.ts`
- Create: `src/server/services/legal-page-service.ts`
- Test: `tests/integration/legal-pages-service.test.ts` (mock `next/cache` like `tests/integration/redirects-api.test.ts`)

**Interfaces:**

- Produces `legalPageRepository`: `list({page,limit})`, `listPublished(): Promise<{id,title,slug,displayOrder}[]>` (ordered by `displayOrder`), `byId(id)`, `bySlug(slug)`, `insert(data, tx)`, `patch(id, data, tx)`, `remove(id)`, `reorder(ids)`.
- Produces `legalPageService`:
  - `listPublishedLinks(): Promise<{ title: string; slug: string }[]>` — `'use cache'`, `cacheTag(CACHE_TAGS.all('legal-pages'))`, `cacheLife('hours')`.
  - `getPublishedBySlug(slug): Promise<LegalPage | null>` — cached, tags `all` + `CACHE_TAGS.detail('legal-pages', slug)`; returns null for draft.
  - `listAdmin`, `byId`, `create(actor, input)`, `update(actor, id, input)`, `remove(id)`, `reorder(input)`.
  - `assertSlugAvailable(tx, slug, exceptId?)` — throws `ApiError(VALIDATION_ERROR, msg, 422, { slug: [msg] })` for reserved/live/duplicate; for a redirect source match throws 409 `CONFLICT` with `{ slug: ['A redirect from /<slug> already exists — remove it in SEO → Redirects first'] }`.
- Rules inside `update` (one `db.transaction`): if row is published and slug changes → `assertSlugAvailable` except the case in Review Focus #4 (a redirect whose source is the new path and destination is this page's current path is deleted, not a conflict), then `createRedirect(tx, { from: '/'+old, to: '/'+new, statusCode: 301, note: 'Legal page renamed', createdBy: actor.userId })`. `publishedAt = new Date()` when (draft→published) or (stays published and title/content changed). Every write: `revalidateTag(LIST_TAG,'hours')`, detail tags for old+new slug, and `revalidateTag(REDIRECTS_TAG, { expire: 0 })` when a redirect was written.

- [ ] **Step 1: Failing tests:** create draft → `listPublishedLinks()` is `[]`; publish → contains `{title, slug}` and `publishedAt` set; edit title of published → `publishedAt` increases; reorder only → `publishedAt` unchanged; rename published `privacy`→`privacy-policy` → `redirects` row `/privacy`→`/privacy-policy` status 301; rename back → no loop, stale redirect removed, new `/privacy-policy`→`/privacy` exists; `create` with slug `about`, `dashboard`, `login` → 422; slug equal to an existing redirect source → 409; mock `db` select to throw → `listPublishedLinks()` rejects (not `[]`).
- [ ] **Step 2:** `yarn test:integration tests/integration/legal-pages-service.test.ts` → FAIL.
- [ ] **Step 3:** Implement repository + service.
- [ ] **Step 4:** Tests PASS.
- [ ] **Step 5:** Commit `feat(legal-pages): add repository and service`.

### Task 3: API routes

**Files:**

- Create: `src/server/api/legal-pages.ts`
- Modify: `src/server/api/index.ts` (import + `.route('/legal-pages', legalPages)` next to `/services`)
- Test: `tests/integration/legal-pages-api.test.ts`

**Interfaces:**

- Consumes: `legalPageService`, schemas from Task 1.
- Produces endpoints (mirror `services.ts` order — `/reorder` before `/:id`): `GET /legal-pages/admin/list`, `GET /legal-pages/:id`, `POST /legal-pages`, `PATCH /legal-pages/reorder`, `PATCH /legal-pages/:id`, `DELETE /legal-pages/:id`. Audit actions `legal_page.create|update|delete|reorder`, entityType `legal_page`. No public JSON endpoint (pages are server-rendered).

- [ ] **Step 1: Failing tests:** roles with `content` write (check `ROLE_NAMES`/permissions in `src/lib/auth/permissions`, follow `redirects-api.test.ts` `it.each`) get 201/200 and one audit row; viewer gets 403 on write; anonymous 401; POST slug `services` → 422 with `error.causes.slug`; POST content with `javascript:` link → 422; PATCH unknown id → 404; DELETE removes row.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement routes.
- [ ] **Step 4:** PASS; `yarn typecheck` clean.
- [ ] **Step 5:** Commit `feat(legal-pages): add admin API`.

### Task 4: Server-side Tiptap renderer

**Files:**

- Create: `src/lib/legal-pages/render.ts`
- Test: `src/lib/legal-pages/render.test.ts`

**Interfaces:**

- Produces: `renderLegalHtml(doc: TiptapDoc): string` and `excerptOf(doc: TiptapDoc, max = 160): string` (plain text of the first paragraphs, for meta description).
- Use `@tiptap/html`'s server-safe `generateHTML` (the `/server` entry in v3 — confirm) with StarterKit configured to the allowlist (disable codeBlock, code, strike, heading levels `[2,3,4]`, Link with `protocols`/`isAllowedUri` = `isSafeHref`, `HTMLAttributes` per external/internal rule). Before rendering, re-parse with `tiptapDocSchema.safeParse`; on failure render `''` and log once — never throw on the public page.

- [ ] **Step 1: Failing tests:** heading 2 + paragraph → `<h2>…</h2><p>…</p>`; external link has `rel="noopener noreferrer"` and `target="_blank"`; relative link `/contact` has no `target`; a hand-crafted doc containing `javascript:` href renders without that `href`; text `<script>` is escaped; `excerptOf` trims to 160 chars on a word boundary.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** `yarn add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/html`; implement.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(legal-pages): render tiptap content on the server`.

### Task 5: Public page + sitemap

**Files:**

- Create: `src/app/(marketing)/[slug]/page.tsx`
- Create: `src/components/marketing/legal-page-view.tsx` (title, "Last updated {d MMMM yyyy}" in `en-IE`, prose body)
- Modify: `src/server/queries/get-page-seo.ts` — `getSitemapEntries` adds `cacheTag(CACHE_TAGS.all('legal-pages'))` and appends `{ path: '/'+slug, changeFrequency: 'yearly', priority: 0.3, lastModified: publishedAt }` for each published page (skip all when `robots === 'noindex'`, as today).
- Test: `src/components/marketing/legal-page-view.test.tsx`, extend `tests/integration` sitemap coverage if a sitemap test exists, else add `tests/integration/legal-pages-sitemap.test.ts`.

**Interfaces:**

- Consumes: `legalPageService.getPublishedBySlug`, `renderLegalHtml`, `excerptOf`.
- Page: `generateMetadata({ params })` (params is a Promise in Next 16 — check docs) → `{ title: page.title, description: excerptOf(content), alternates: { canonical: '/'+slug } }`, falls back to `notFound()` metadata for unknown; default export calls `notFound()` for null. Do not add `generateStaticParams` unless the docs require it for `'use cache'` dynamic segments — follow `node_modules/next/dist/docs/`.
- Styling: dark marketing theme; reuse typography from existing marketing sections; constrain prose to ~720px.

- [ ] **Step 1: Failing tests:** view renders `<h1>` title, formatted date, and the HTML body; sitemap includes `/privacy-policy` for a published page and excludes a draft.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; `yarn build` succeeds and `/about` still renders the About page (static wins).
- [ ] **Step 5:** Commit `feat(legal-pages): serve published pages at the site root`.

### Task 6: Footer + remove broken defaults

**Files:**

- Modify: `src/components/marketing/footer.tsx:47-48,160-167` — add `legalPageService.listPublishedLinks()` to the `Promise.all`; render manual `legalLinks` first, then legal pages as `<Link href={'/'+slug}>{title}</Link>`, then `{cookieSettings}`. Dedupe: skip a manual link whose href equals a legal page's path.
- Modify: `src/lib/content/globals.ts:159-166` — default becomes `[{ label: 'Login', href: '/login' }]`.
- Create: migration `src/server/db/migrations/00xx_drop_placeholder_legal_links.sql` (custom via `drizzle-kit generate --custom`): for `settings.key = 'footer'`, in both `value` and `draft`, remove `legalLinks` array elements whose `href` is exactly `#privacy` or `#terms`; leave everything else.
- Test: `src/components/marketing/marketing-chrome.test.tsx` (extend), `src/features/globals/global-ui.test.ts` if it asserts the default.

- [ ] **Step 1: Failing tests:** footer with one published page renders its link after "Login" and before cookie settings; manual link `/privacy-policy` + page `privacy-policy` renders once; defaults no longer contain `#privacy`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; run the migration against the local DB and check with `select value->'legalLinks' from settings where key='footer'`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(legal-pages): list published pages in the footer`.

### Task 7: Admin UI

**Files:**

- Create: `src/features/legal-pages/` mirroring `src/features/services/` — `components/legal-page-form.tsx`, `components/legal-page-editor.tsx` (Tiptap, client), `components/list/legal-page-table.tsx` (+ test), `components/create/index.tsx`, `components/edit/index.tsx`, `hooks/api/query/use-legal-page-list.ts`, `use-legal-page-detail.ts`, `hooks/api/mutation/use-create-legal-page.ts`, `use-update-legal-page.ts`, `use-delete-legal-page.ts`, `use-reorder-legal-pages.ts`.
- Create: `src/app/(main)/(protected)/(dashboard_layout)/dashboard/(site)/legal-pages/(list)/page.tsx`, `(mutation)/create/page.tsx`, `(mutation)/[id]/edit/page.tsx` (copy services pages' structure).
- Modify: `src/lib/routes/app-routes.ts` (add `legalPages: { index, create, edit(id) }`), `src/lib/admin/nav.ts` (entry `id: 'website-legal-pages'`, label `Legal pages`, href `/dashboard/legal-pages`, `permission: { content: ['read'] }`, keywords `['privacy', 'terms', 'cookie', 'policy']`, placed after Services), and wherever `/dashboard/services` is also registered (`src/features/ai/lib/route-context.ts`, `src/lib/admin/coming-soon.ts`, `src/lib/seo/public-pages.ts` if it lists admin hrefs) only if those lists are exhaustive.

**Interfaces:**

- Consumes: API from Task 3, `slugify` and schemas from Task 1.
- Form: title input; slug input auto-filled by `slugify(title)` until the user edits the slug by hand; status switch Draft/Published; editor toolbar: H2, H3, bold, italic, underline, bullet list, ordered list, blockquote, link (prompt for URL in a small popover, validated with `isSafeHref`), horizontal rule, undo/redo. Server `causes.slug` errors show under the slug field. Published + slug changed → inline note "The old address will redirect here."
- List: title, `/<slug>`, status badge, "Last updated", reorder (same control `service-table.tsx` uses), edit, delete with confirm dialog.

- [ ] **Step 1: Failing test** `legal-page-table.test.tsx`: renders rows with status badge and `/slug`; delete asks for confirmation before calling the mutation.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement feature module, pages, nav, routes.
- [ ] **Step 4:** PASS; `yarn lint && yarn typecheck`.
- [ ] **Step 5:** Manually in `yarn dev`: create "Privacy Policy" draft → not in footer, `/privacy-policy` 404; publish → in footer, page renders with date; rename slug → old URL 301s; try slug `about` → field error.
- [ ] **Step 6:** Commit `feat(legal-pages): add admin screens with tiptap editor`.

### Task 8: Final verification

- [ ] `yarn lint && yarn typecheck && yarn test && yarn build` all green; paste failures verbatim if any.
- [ ] `git status` shows only intended files (AGENTS.md regen by `next dev` may be committed per AGENTS.md).
