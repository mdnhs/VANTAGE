# Our Work (Portfolio) — Vantage Autobody — Brief

## Source

Figma: `Security Partners LTD (Copy)`, node `2035:190` — "Our Work - Vantage Autobody", dev-mode, pulled via local Figma MCP (`figma-local`).

## What

Portfolio/gallery page at `/our-work` reusing the homepage's `MarketingHeader`/`MarketingFooter` shell (`docs/homepage/brief.md`). Shows recent restoration projects in a staggered bento grid with category filters.

## Sections (top → bottom)

1. **Header/Footer** — reused as-is from the homepage build; header's "Our Work" nav link becomes active on this route.
2. **Portfolio hero** — eyebrow ("Portfolio"), 2-line heading ("Our Recent Restorations."), subcopy.
3. **Filter pills** — horizontal scrollable row: All (active/highlighted), Crash Repair, Bodywork, Paint, Respray, Restoration, Custom. Design has no filtering logic specified beyond visual active state — **static, non-functional** for this slice (no client-side filtering wired; see non-goals).
4. **Project grid** — 4 projects in a 2-column staggered/bento layout (alternating aspect ratios: 4:3, 3:4, 4:5, 16:9, with the 2nd column offset). Each card: image, category badge (top-left), external-link icon, title, description, and a hover-only "View Before State" chip (bottom-right) that cross-fades to the before-photo — stacked layers with `group-hover:opacity-*` (pure CSS, no client JS needed).
5. **Load more projects** button — static, bordered, no pagination logic (only 4 projects exist in source).

## Projects (from Figma — real content, not placeholders)

| Vehicle             | Category badge     | Subtitle                                    | Aspect |
| ------------------- | ------------------ | ------------------------------------------- | ------ |
| BMW 3 Series        | Crash Repair       | Extensive Rear Quarter Panel Reconstruction | 4:3    |
| Porsche 911 Carrera | Full Respray       | Bare Metal Respray & Preservation           | 3:4    |
| Audi RS6 Avant      | Paint Correction   | Multi-stage Correction & Ceramic Coat       | 4:5    |
| Defender 110        | Custom Fabrication | Widebody Conversion & Matte Finish          | 16:9   |

## Visual language

Same fixed dark brand skin as the homepage (`#131313`/`#0e0e0e`, `#e5e2e1`/`#e6bdb8` text, `#ffb4ab` accent, Manrope headings / Inter body) — no new tokens needed.

## Assets

8 new project photos (4 "after" hero shots + 4 "before" shots for the hover state) + 2 new icons (external-link corner icon, load-more arrow), downloaded to `public/assets/marketing/`. Header/footer/social/contact icons are reused from the homepage build.

## Non-goals

- No working category filters (pills are static; wiring them to actually filter the grid needs either client state or query params — out of scope until asked).
- No "Load more" pagination — only the 4 designed projects exist; button is static.
- No filtering/routing by category (`?category=crash-repair` etc.) — not specified in design.
