# About Us — Vantage Autobody — Brief

## Source

Figma: `Security Partners LTD (Copy)`, node `2035:706` — "About Us - Vantage Autobody", dev-mode, pulled via local Figma MCP (`figma-local`).

## What

Replaces the existing scaffold placeholder at `src/app/(marketing)/about/page.tsx` (currently just an `<h1>About</h1>` from `create-next-app`) with the real About page, reusing the shared `MarketingHeader`/`MarketingFooter`.

## Sections (top → bottom)

1. **Hero** — bg photo + bottom gradient fade, eyebrow ("About Vantage Autobody"), 2-line heading with per-word inline color: "Built on **Craft**." (Craft in salmon `#ffb4ab`) / "Driven by **Quality**." (Quality in a new silver-grey accent `#c4c7ca`, introduced on this page only).
2. **Our Heritage** — 2-column: left = heading, 6-line founding story paragraph, stat pair (1998 EST. / 25+ Years of Precision); right = large photo with an overlapping glass quote-card (icon + italic pull-quote) offset upward over the photo's bottom edge.
3. **The Precision Team** — dark section (`#1c1b1b`) with a soft right-side gradient glow, heading + intro, 3 team-member cards: desaturated photo (grayscale treatment), bottom gradient, name + role. Real people/roles from Figma (see table).
4. **Uncompromising Standards** — large photo left, content right: eyebrow ("Facility & Tech"), 2-line heading, 3 icon+heading+description feature rows.
5. **Header/Footer** — reused; header's "About" nav link becomes active on this route (currently a `#about` anchor — needs `/about`, which already exists as a route).

## Content (from Figma — real content)

**Heritage stats:** 1998 (Est.) · 25+ (Years of Precision)

**Heritage story:** "Founded in 1998, Vantage Autobody began with a singular obsession: to elevate automotive repair from a trade to a precision craft. What started as a modest two-bay garage specializing in classic restorations has evolved into Ireland's premier high-end collision and repair facility."

**Pull quote:** "We don't just fix cars; we restore the engineering integrity and aesthetic perfection of every vehicle that crosses our threshold."

**Team:**

| Name              | Role                      |
| ----------------- | ------------------------- |
| Declan O'Rourke   | Master Technician         |
| Siobhan Gallagher | Lead Refinisher           |
| Liam Murphy       | Diagnostics & Calibration |

**Standards:**

| Feature                            | Description                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Laser Chassis Alignment            | Using millimeter-perfect computerized jigs to return structural integrity to factory specifications post-collision.      |
| Climate-Controlled Spray Booths    | Downdraft technology ensures a dust-free environment for flawless, baked-on finishes that match OEM standards perfectly. |
| NCT Compliant & Insurance Approved | We work directly with major insurers. All structural repairs guarantee full NCT compliance and roadworthiness.           |

## Visual language

Same fixed dark brand skin as the rest of the site. Two new elements introduced here, both reused as-is (no new tokens needed beyond the one new color):

- Second accent color `#c4c7ca` (cool silver-grey) alongside the salmon `#ffb4ab`, used for the "Quality" heading word and the Facility & Tech eyebrow/divider.
- Desaturated team photos — Figma uses `mix-blend-mode: saturation` with a white overlay; implemented with Tailwind's `grayscale` filter instead (same visual result, standard CSS, no blend-mode fragility).

## Assets

7 new photos (hero background, heritage image, 3 team portraits, standards facility image) + 4 icons (quote-card icon, 3 standards feature icons) downloaded to `public/assets/marketing/`. Header/footer/logo/social/contact assets reused as-is.

## Non-goals

- No team-member detail pages/links — cards are static.
- No functional links on stat numbers or facility copy.
