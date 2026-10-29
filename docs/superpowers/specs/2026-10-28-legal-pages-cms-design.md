# Legal pages CMS — design

## Why

The footer's legal bar is driven by `globals.footer.legalLinks` (label + href, edited in
admin Globals). The defaults point at `#privacy` and `#terms` — there are no actual legal
pages behind them. The owner wants admins to create legal pages (Privacy Policy, Terms,
Cookie Policy, …) themselves from the admin panel, with a rich-text editor, and have them
appear in the footer automatically, with no developer involvement.

## Goals

- Admin section "Legal pages": list, create, edit, delete, reorder.
- Each page has: **title**, **slug** (auto-generated from the title, editable), **body**
  written in a **Tiptap** editor, **Draft / Published** status, display order.
- A published page is served at the **site root**: `/<slug>`, e.g. `/privacy-policy`.
  No `/legal/` prefix (owner decision).
- Every published page's title appears as a link in the footer legal bar, in the admin-set
  order. Unpublishing or deleting removes it from the footer.
- The public page shows a "Last updated" date (the page's last published content change).
- Published pages are included in `sitemap.xml`.

## Non-goals

- Not a general page builder: no layouts, sections, hero blocks — a title and a prose body.
- No per-page SEO editor beyond what falls out naturally (title → `<title>`, a description
  can be derived from the body's first text). Leave hooks for later.
- No scheduled publishing, no multi-language.

## Anti-goals (would make this a failure even if it works)

- A slug that shadows an existing app route or a reserved path (`/about`, `/services`,
  `/dashboard`, `/login`, `/api`, …) — must be impossible to save.
- Storing/serving unsanitised HTML (XSS from the editor into the public site).
- Draft content leaking onto the public site or footer.
- The footer or legal page breaking the "DB failure ⇒ don't cache the fallback" rule
  (see commit ca23e8a).

## Decisions (owner's)

1. URL is root-level `/<slug>`.
2. Draft / Published toggle; only Published shows on the site and in the footer.
3. Footer order is admin-controlled (reorder in the list).
4. Existing manual footer `legalLinks` (e.g. "Login") stay. Legal pages are appended
   automatically next to them. The broken `#privacy` / `#terms` defaults are removed from
   the schema default (and from stored data if they are still the untouched defaults).
5. Body stored as Tiptap JSON in the DB; rendered to HTML on the server for the public page.
6. "Last updated" date shown on the page; pages listed in the sitemap.

## Constraints / fit with the existing codebase

- Stack: Next.js 16 (read `node_modules/next/dist/docs/` — conventions differ), Hono API
  under `src/server/api`, Drizzle/Neon schema under `src/server/db/schema`, feature modules
  under `src/features/*`. Follow the `backend-resource` / `new-feature` project skills and
  mirror an existing CRUD entity (`services` is the closest: schema, service with
  `cacheTag`/`revalidateTag`, Hono routes guarded by `can({ content: [...] })`, admin pages
  under `src/app/(main)/(protected)/(dashboard_layout)/dashboard/`).
- Permissions: reuse the `content` permission (read/create/update/delete), same as services.
- Slug validation must reject: anything `isReservedPath()` rejects, anything in
  `LIVE_PATHS` (`src/lib/seo/public-pages.ts`), any static route segment under
  `src/app/(marketing)`, and duplicates. Lowercase `a-z0-9-` only. Validate on the server,
  not only in the form.
- Routing: a dynamic root segment (e.g. `src/app/(marketing)/[slug]/page.tsx`); static
  routes win over it in Next. Unknown/draft slug → `notFound()`.
- Proxy (`src/proxy.ts`): non-live public paths go to the redirect resolver. A redirect
  whose source equals a legal page's path would take precedence — the admin UI should warn
  (or block) when a slug collides with an existing redirect source.
- Caching: public reads cached with a tag; every write revalidates the list tag, the
  page's tag, the footer, and the sitemap. A DB failure must not be cached as "no pages".
- Sanitisation: render Tiptap JSON → HTML on the server with a fixed extension allowlist
  (headings, paragraphs, bold/italic/underline, lists, links, blockquote, hr; maybe tables).
  Links: `http(s)`, `mailto:`, `tel:` and site-relative only; external links get
  `rel="noopener noreferrer"`. No raw HTML node, no inline images in v1 (builder may add
  media-library images if trivial).
- Styling of the public page: match the marketing site (dark theme, existing typography);
  use the marketing layout so header/footer are present.
- Audit log: writes go through the existing audit service like other entities.

## Calls made by the designer (not owner decisions — owner to confirm)

- **Slug rename on a published page:** automatically create a 301 redirect from the old
  path to the new one via the existing redirects feature, so shared links don't break.
- **Redirect collision:** block the save (not just warn) when the slug equals an existing
  redirect source; the error names the redirect so the admin can remove it.
- **Delete:** hard delete with a confirm dialog (snapshot to `revisions` first if revisions
  are implemented).
- **"Last updated":** bumps when a published page's title or body changes, or when it is
  published; reordering or slug-only edits do not bump it.
- **Untouched defaults:** a one-time migration drops stored `legalLinks` entries whose href
  is exactly `#privacy` or `#terms`; every other entry is left alone.

## Left to the builder

- Exact table/column names (suggested `legal_pages`: id, title, slug unique, content jsonb,
  status, display_order, published_at, created_at, updated_at).
- Whether to snapshot into the existing `revisions` table on publish (nice to have).
- Tiptap package choice (`@tiptap/react`, `@tiptap/starter-kit`, link extension,
  `@tiptap/html` or `generateHTML` for server render) and the toolbar UI.
- Reorder UI (drag handle or up/down buttons — follow whatever existing lists use).
- Whether the redirect resolver learns legal slugs as "live" to skip the loopback call.
- Seed data: optionally seed empty Draft "Privacy Policy" and "Terms of Service" pages.
- Tests: follow existing patterns (vitest; service, route, slug-validation, footer render).
