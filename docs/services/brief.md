# Services — Vantage Autobody — Brief

## Source

Figma: `Security Partners LTD (Copy)`, node `2035:393` — "Services - Vantage Autobody", dev-mode, pulled via local Figma MCP (`figma-local`).

## What

Services page at `/services` reusing the homepage's `MarketingHeader`/`MarketingFooter` shell. Presents 4 services as large, editorial feature blocks rather than a uniform card grid.

## Sections (top → bottom)

1. **Header/Footer** — reused; header's "Services" nav link becomes active on this route (currently a `#services` anchor — needs a real href like `/our-work` got).
2. **Hero** — eyebrow ("Master Craftsmanship"), 2-line heading (line 1 solid, line 2 a gradient-text treatment: `#e5e2e1 → #ffb4ab → #e5e2e1`), centered subcopy, background photo with top/bottom gradient fade.
3. **Crash Repair** (feature block #01) — large photo (7/12 cols) with a huge "01" watermark numeral bottom-left, overlapped on its right edge by a glass content card (heading, 4-line description, 3-item checklist, "Get a Quote" button).
4. **Dent Repair / Scratch Repair** (split pair) — two equal-width simple cards side by side: photo top, heading/description/"Quote Service" text-link below. No watermark, no overlap trick — much simpler than the feature blocks.
5. **Precision Paintwork** (feature block #02) — mirror of the Crash Repair block: photo on the right (6/12 → 12, i.e. cols 6-12) with "02" watermark bottom-right, glass card on the left (not overlapping this time, sits in its own column), same heading/description/checklist/button pattern.

## Content (from Figma — real content)

| Block | Heading             | Description                                                                                                                                                                                 | Checklist                                                                   | CTA           |
| ----- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------- |
| #01   | Crash Repair        | Structural integrity is paramount. We utilize laser measuring systems and factory-approved alignment jigs to ensure your chassis is restored to exact OEM tolerances after a collision.     | Structural Realignment · Laser Chassis Measuring · Factory Panel Welding    | Get a Quote   |
| split | Dent Repair         | Flawless surface correction using advanced Paintless Dent Repair (PDR) techniques or traditional bodywork for severe impacts.                                                               | —                                                                           | Quote Service |
| split | Scratch Repair      | Precision color matching and localized clear coat blending to eradicate surface abrasions without repainting entire panels.                                                                 | —                                                                           | Quote Service |
| #02   | Precision Paintwork | From localized blending to complete bare-metal resprays, our climate-controlled downdraft booths ensure a glass-like finish. We use computerized color matching for an undetectable repair. | Computerized Color Matching · Multi-stage Clearcoat · Full Factory Resprays | Get a Quote   |

## Visual language

Same fixed dark brand skin as the homepage/our-work pages — no new tokens. New pattern introduced here: the giant translucent numeral watermark (`text-[128px] text-[#e5e2e1]/20`) and the glass content card (`bg-[#201f1f]/95 backdrop-blur-md`, distinct from the homepage's lighter `bg-white/4` service cards).

## Assets

5 new photos (hero background, crash-repair image, dent-repair background, scratch-repair background, paintwork image) + checklist-item icons (1 shared icon for the crash-repair list, 3 distinct icons for the paintwork list) + a small CTA arrow (reused button icon) + a text-link arrow (reused from "Learn More" pattern), downloaded to `public/assets/marketing/`. Header/footer/logo/profile/social/contact assets are reused as-is.

## Non-goals

- No functional quote form — "Get a Quote"/"Quote Service" are static links (`#quote`), matching the pattern already used on the homepage and our-work pages.
- No hover/interaction states beyond what's free with CSS (design doesn't specify any beyond default link/button colors here).
