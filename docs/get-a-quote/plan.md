# Get a Free Quote — Plan (Vertical Phases)

Each phase renders a visibly verifiable increment of the real page. Build → view in browser → next.

## Phase 0 — Assets

- Download 6 icons (registration/car, Collision Repair, Paint & Finish, Restoration, Detailing, continue-arrow) into `public/assets/marketing/`.
- Verify: files exist, non-zero size, correct real format.

## Phase 1 — Route + header CTA wiring

- `src/app/(marketing)/get-a-quote/page.tsx` scaffold rendering `MarketingHeader` + `MarketingFooter` only.
- Update `header.tsx`: "Get a Free Quote" CTA points at `/get-a-quote` instead of `#quote`.
- Update homepage/services hero CTAs ("Get a Free Quote" / "Get a Quote" buttons) to point at `/get-a-quote` too, for a coherent funnel.
- Verify: all "Get a (Free) Quote" buttons site-wide navigate to `/get-a-quote`.

## Phase 2 — Hero block + decorative background

- `src/components/marketing/quote-hero.tsx`: accent bar, 2-line Manrope heading, subcopy.
- Decorative glow shapes (gradient panel top-right, blurred circle bottom-left) as plain CSS divs, no assets.
- Verify: matches Figma screenshot; glows sit behind content (z-index/stacking correct — learned from the homepage hero `-z-10` stacking bug, verify visually not just class-by-class).

## Phase 3 — Form shell + progress indicator

- `src/components/marketing/quote-form.tsx` (client component): dark rounded card, progress indicator row (numbered circle + "Vehicle" label, dot/line track, dimmed upcoming-step labels).
- Verify: matches screenshot at desktop width.

## Phase 4 — Step 1 fields

- Registration/Make/Model/Year inputs as real controlled inputs inside `quote-form.tsx`, 2×2 grid, bottom-border input styling, car icon on registration field.
- Verify: typing in each field updates its value (React state, not just visual).

## Phase 5 — Primary Service selector

- 4-card single-select (icon + label), "Collision Repair" defaulting to selected; client state toggles the salmon border/glow on click.
- Verify: clicking a different card moves the selected style; only one selected at a time.

## Phase 6 — Continue button + assemble + metadata

- Static "Continue to Damage" button (no-op — see brief non-goals).
- Assemble hero + form card into `get-a-quote/page.tsx`; add page `metadata`.
- Verify: `yarn build` passes, route prerenders static (`○`) despite being a client component (no server data dependency), `yarn lint` clean.

## Phase 7 — Visual QA

- Dev server + browser screenshot at 1440px, compare against Figma export.
- Manually test: typing in fields, clicking each service card, confirm progress indicator matches design at step 1.

---

**Note:** phases execute in this session unless blocked; each phase is independently committable.
