# Services — Plan (Vertical Phases)

Each phase renders a visibly verifiable increment of the real page. Build → view in browser → next.

## Phase 0 — Assets

- Download 5 photos + 4 icons (1 crash-repair checklist icon, 3 paintwork checklist icons) into `public/assets/marketing/`.
- Verify: files exist, non-zero size, correct real format (check with `file`, per the earlier `.png`-is-actually-`.jpg` lesson from the homepage build).

## Phase 1 — Route + header nav wiring

- `src/app/(marketing)/services/page.tsx` scaffold rendering `MarketingHeader` + `MarketingFooter` only.
- Update `header.tsx`: "Services" points at `/services` instead of the `#services` anchor.
- Verify: `/services` renders header+footer, "Services" nav item highlighted; `/` and `/our-work` still highlight correctly.

## Phase 2 — Services hero

- `src/components/marketing/services-hero.tsx`: eyebrow, 2-line heading with gradient-text 2nd line, centered subcopy, bg photo + gradient fade.
- Verify: matches Figma screenshot; gradient-text renders (not just a solid fallback color) in both a normal browser check.

## Phase 3 — Feature block component (Crash Repair)

- `src/components/marketing/service-feature-block.tsx`: reusable block taking image, watermark number, side (`image-left`/`image-right`), heading, description, checklist items (icon + label), CTA label.
- Wire Crash Repair (#01, image-left, overlapping glass card) first.
- Verify: overlap/offset matches screenshot at desktop width; watermark numeral sits behind the image, not the card.

## Phase 4 — Dent/Scratch split pair

- `src/components/marketing/service-split-card.tsx`: simple 2-up card (photo top, content below, text-link CTA). Data-driven with the 2 real entries from brief.md.
- Verify: matches screenshot; cards equal height/width at desktop.

## Phase 5 — Precision Paintwork block

- Reuse `service-feature-block.tsx` with `side="image-right"` (mirrored, non-overlapping card variant per brief).
- Verify: mirrors Crash Repair correctly (image/card swapped, watermark bottom-right).

## Phase 6 — Assemble + metadata

- Compose hero + Crash Repair block + split pair + Paintwork block into `services/page.tsx`; add page `metadata`.
- Verify: `yarn build` passes, route prerenders static (`○`), `yarn lint` clean.

## Phase 7 — Visual QA

- Dev server + browser screenshot at 1440px, compare against Figma export.
- Confirm shared Header/Footer container-width fixes (edge-to-edge 48px) still hold on this route.

---

**Note:** phases execute in this session unless blocked; each phase is independently committable.
