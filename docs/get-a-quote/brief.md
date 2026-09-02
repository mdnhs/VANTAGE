# Get a Free Quote — Vantage Autobody — Brief

## Source

Figma: `Security Partners LTD (Copy)`, node `2035:597` — "Get a Free Quote - Vantage Autobody", dev-mode, pulled via local Figma MCP (`figma-local`).

## What

Multi-step quote-request page at `/get-a-quote`, reusing the shared `MarketingHeader`/`MarketingFooter`. **Only step 1 of 4 ("Vehicle") is designed** — steps 2–4 (Damage, Photos, Contact) exist only as dimmed labels in the progress indicator, with no field/layout spec. This build implements step 1 as a real, stateful form; steps 2–4 are out of scope (see non-goals).

## Font decision

Figma specifies `Liberation Serif Bold` for this page's H1 and CTA button label — every other page uses Manrope. Liberation Serif is a generic Linux metric-compatible fallback font, not a typeface anyone would deliberately brand with; it's almost certainly a Figma-export artifact (the real font wasn't available to the exporter), not an intentional design choice. **Decision (confirmed with user): use Manrope**, matching every other page's heading font, to keep the site's type system consistent.

## Sections (top → bottom)

1. **Header/Footer** — reused; header's "Get a Free Quote" CTA buttons (nav bar + hero CTAs on other pages) should link here instead of the `#quote` placeholder anchor.
2. **Decorative background** — two soft glow shapes: a salmon vertical gradient panel top-right (`mix-blend-screen`), a blurred salmon circle bottom-left. Pure CSS, no image assets.
3. **Hero/header block** — small accent bar, 2-line heading ("Get Your Repair Quote."), subcopy.
4. **Form card** — dark rounded card containing:
   - **Progress indicator** — step "01" as a filled salmon circle + "Vehicle" label (active), a horizontal dot/line track (4 dots, 3 connecting lines), and the 3 upcoming step labels ("02 Damage", "03 Photos", "04 Contact") dimmed to 40% opacity.
   - **Step 1 fields** — Registration Plate (text input w/ car icon), Vehicle Make, Vehicle Model, Year — 2×2 grid, each field a bottom-border-only dark input.
   - **Primary Service Required** — 4 selectable cards (icon + label): Collision Repair (pre-selected — salmon border + glow), Paint & Finish, Restoration, Detailing.
   - **Continue to Damage** button — bottom-right, salmon, arrow icon.

## Behavior (in scope)

- Form fields (registration, make, model, year) are real controlled inputs (local component state) — not just static markup, so the page reads as a genuine form even though submission has nowhere to go yet.
- Primary Service selector is a real single-select (client state), defaulting to "Collision Repair" per the design's pre-selected state, with visible selected/unselected styling matching the design.

## Non-goals

- **Steps 2–4 are not built** — no Damage/Photos/Contact panels exist in the source design (only dimmed labels), so nothing is fabricated for them. "Continue to Damage" is present and styled per design but is a no-op (no step-2 UI to advance to) — this is disclosed here rather than silently faked.
- No form submission / API wiring — no backend endpoint exists yet for quote requests.
- No client-side validation beyond native HTML input semantics (e.g. `type="number"` on Year).

## Visual language

Same fixed dark brand skin as the rest of the site, with Manrope for headings (see Font decision above) instead of the Figma-specified Liberation Serif.

## Assets

6 new icons (registration/car icon, 4 service-type icons, continue-arrow icon) downloaded to `public/assets/marketing/`. No new photos — this page has no imagery, only decorative gradient/blur shapes built in CSS.
