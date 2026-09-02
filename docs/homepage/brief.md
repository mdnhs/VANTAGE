# Homepage — Vantage Autobody — Brief

## Source

Figma: `Security Partners LTD (Copy)`, node `2035:3` — "Homepage - Vantage Autobody", dev-mode, pulled via local Figma MCP (`figma-local`).

## What

Marketing homepage for Vantage Autobody (car crash repair / restoration business) rendered inside the existing `(marketing)` route group, replacing the scaffold placeholder at `src/app/(marketing)/page.tsx`.

## Sections (top → bottom)

1. **Header** — fixed/sticky, logo + wordmark, nav (Home/Services/Our Work/Insurance/About/Process/Contact), "Get a Free Quote" CTA, profile avatar.
2. **Hero** — background photo w/ dark gradient overlays, eyebrow label, 3-line headline, subcopy, two CTAs (primary quote, secondary "View Our Work").
3. **Trust strip** — 4-item glass card row overlapping hero/services boundary (Professional Body Repair, Precision Colour Match, Insurance Support, Quality Workmanship), each w/ icon.
4. **Services ("Core Capabilities")** — eyebrow + heading + "Explore all services" link, grid of service cards (icon, title, 2-line description, hover "Learn more" link). **Design only fully specifies 2 cards** (Crash Repair, Dent Repair) — the 3rd node is a designer annotation ("Add remaining service cards similarly to fill out the 8 requested") with no real content for cards 3–8. Built as a data-driven list so more can be appended without fabricating business copy now.
5. **Footer** — logo/wordmark + blurb + social icons, Services nav, Company nav, Contact block (address/phone/email), bottom bar (copyright, privacy/terms links).

## Visual language

- Fixed dark theme (not tied to the app's light/dark shadcn toggle) — bg `#131313`/`#0e0e0e`, text `#e5e2e1` / muted `#e6bdb8`, accent `#ffb4ab` (salmon), CTA red `#dc2626`.
- Headings: Manrope (ExtraBold/Bold/SemiBold), uppercase, tight tracking. Body/nav/labels: Inter.
- Glass/blur cards (`backdrop-blur`, translucent white/black fills), 1px hairline borders.

## Stack constraints (existing project)

- Next.js 16 App Router, Tailwind v4, shadcn/ui (`@base-ui/react` primitives), `cn()` from `@/lib/utils`.
- Existing global theme in `globals.css` is the app's shadcn oklch token system (used by dashboard/auth). This homepage's palette is a distinct fixed brand skin — implemented with literal hex values scoped to marketing components, not by repointing the shared semantic tokens.
- Fonts: app currently loads Geist via `src/lib/font.ts`. Add Manrope + Inter (Google, via `next/font`) alongside, applied only within the marketing route group so the rest of the app is unaffected.
- No CMS/DB — all copy is static content in components (no backend slice needed for this page).

## Assets

All images/icons exported from Figma via `get_design_context` as `localhost:3845` asset URLs (expire ~7 days) — downloaded and committed under `public/assets/marketing/` per the design-to-code skill's rule (never hand-authored SVGs).

## Non-goals

- No CMS-driven services list, no functional quote-request form, no auth-aware header state — all links/buttons are static per design (no interactive behavior specified).
- No dark/light toggle on this page — it's a fixed brand theme.
- Cards 3–8 in the services grid are out of scope until real copy/icons exist.
