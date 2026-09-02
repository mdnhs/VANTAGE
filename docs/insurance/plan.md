# Insurance Support — Plan (Vertical Phases)

Each phase renders a visibly verifiable increment of the real page. Build → view in browser → next.

## Phase 0 — Assets

- Download 1 hero photo + 3 feature icons + 2 CTA icons into `public/assets/marketing/`.
- Verify: files exist, non-zero size, correct real format (`file` check).

## Phase 1 — Route + header nav wiring

- `src/app/(marketing)/insurance/page.tsx` scaffold rendering `MarketingHeader` + `MarketingFooter` only.
- Update `header.tsx`: "Insurance" points at `/insurance` instead of `#insurance`.
- Verify: `/insurance` renders header+footer, "Insurance" nav item highlighted; other routes unaffected.

## Phase 2 — Hero

- `src/components/marketing/insurance-hero.tsx`: eyebrow, 3-line heading, subcopy, CTA, portrait photo with CSS blur-glow decoration.
- Verify: matches Figma screenshot; no `-z-10` stacking bug (apply the fix pattern directly this time, verify visually).

## Phase 3 — Seamless Coordination

- `src/components/marketing/coordination-section.tsx`: heading/intro + 3-card bento with the middle card offset upward.
- Verify: matches screenshot; icons render from real downloaded assets.

## Phase 4 — 7-Step process

- `src/components/marketing/process-timeline.tsx`: eyebrow/heading + 7-step responsive grid (simplified from Figma's exact zigzag per brief.md).
- Verify: all 7 steps present with correct labels/descriptions in order; readable and non-overlapping at desktop and mobile widths.

## Phase 5 — CTA band + disclaimer

- `src/components/marketing/insurance-cta.tsx`: heading, subcopy, two buttons (linking to `/get-a-quote`, see brief non-goals).
- Disclaimer block (small centered legal text).
- Verify: matches screenshot; both CTA buttons navigate to `/get-a-quote`.

## Phase 6 — Assemble + metadata

- Compose hero + coordination + process + CTA + disclaimer into `insurance/page.tsx`; add page `metadata`.
- Verify: `yarn build` passes, route prerenders static (`○`), `yarn lint` clean.

## Phase 7 — Visual QA

- Dev server + browser screenshot at 1440px, scrolled through fully (lazy-load lesson from the services/about pages), compare against Figma export.

---

**Note:** phases execute in this session unless blocked; each phase is independently committable.
