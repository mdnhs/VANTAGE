# About Us — Plan (Vertical Phases)

Each phase renders a visibly verifiable increment of the real page. Build → view in browser → next.

## Phase 0 — Assets

- Download 7 photos (hero bg, heritage image, 3 team portraits, standards facility image) + 4 icons (quote-card icon, 3 standards feature icons) into `public/assets/marketing/`.
- Verify: files exist, non-zero size, correct real format (`file` check per the recurring `.png`-is-actually-`.jpg` issue).

## Phase 1 — Route wiring

- Replace `src/app/(marketing)/about/page.tsx` scaffold content, rendering `MarketingHeader` + `MarketingFooter` only for this phase.
- Update `header.tsx`: "About" points at `/about` instead of the `#about` anchor.
- Verify: `/about` renders header+footer, "About" nav item highlighted; other routes unaffected.

## Phase 2 — Hero

- `src/components/marketing/about-hero.tsx`: bg photo + gradient fade, eyebrow, 2-line heading with per-word inline color (salmon "Craft", silver-grey "Quality").
- Verify: matches Figma screenshot; stacking order correct (learned from the homepage hero bug — verify visually, not just by class name).

## Phase 3 — Our Heritage

- `src/components/marketing/heritage-section.tsx`: heading, story paragraph, stat pair, photo with overlapping glass quote-card.
- Verify: quote-card overlap positioning matches screenshot; stat numbers/labels match brief.md table.

## Phase 4 — The Precision Team

- `src/components/marketing/team-section.tsx`: heading/intro + 3 team cards (grayscale photo, gradient overlay, name/role) from brief.md table.
- Verify: photos render desaturated (grayscale filter, not a fragile blend-mode hack); matches screenshot.

## Phase 5 — Uncompromising Standards

- `src/components/marketing/standards-section.tsx`: large photo + 3 icon/heading/description feature rows from brief.md table.
- Verify: matches screenshot; icons render from real downloaded assets.

## Phase 6 — Assemble + metadata

- Compose hero + heritage + team + standards into `about/page.tsx`; add page `metadata` (replacing the scaffold's generic "About"/"About Vantage." copy).
- Verify: `yarn build` passes, route still prerenders static (`○`), `yarn lint` clean.

## Phase 7 — Visual QA

- Dev server + browser screenshot at 1440px, compare against Figma export section by section (including below-the-fold sections — confirmed lazy-loaded images need a scroll-triggered check, not just the first-viewport screenshot, per the services-page lesson).

---

**Note:** phases execute in this session unless blocked; each phase is independently committable.
