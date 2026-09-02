# Homepage — Vantage Autobody — Plan (Vertical Phases)

Each phase renders a visibly verifiable increment of the real page (top → bottom), not a horizontal layer (no "all markup, then all styling" pass). Build → view in browser → next.

## Phase 0 — Assets

- Download every Figma asset referenced by `get_design_context` (hero photo, logo, profile avatar, ~13 icons) into `public/assets/marketing/` with descriptive names.
- Verify: files exist, non-zero size, correct format (png/svg).

## Phase 1 — Fonts + marketing layout shell

- Add `manrope`/`inter` (`next/font/google`) in `src/lib/font.ts`.
- Add `src/app/(marketing)/layout.tsx`: applies the two font variables + fixed dark background to the route group only (doesn't touch root `layout.tsx` or shared shadcn tokens).
- Verify: `yarn dev`, marketing route renders blank dark page with correct fonts loaded (no console font errors), rest of app (`/about`, dashboard) unaffected.

## Phase 2 — Header

- `src/components/marketing/header.tsx`: logo+wordmark, nav links, CTA button, avatar. Sticky/fixed per design.
- Mount in marketing layout.
- Verify: header renders pixel-close to Figma screenshot at 1280+ width; CTA uses project `Button` where variants fit, otherwise a plain styled link if the design's exact red doesn't map to an existing variant.

## Phase 3 — Hero section

- `src/components/marketing/hero-section.tsx`: bg image + two gradient overlays, eyebrow, 3-line heading (last line accent color), subcopy, two CTAs.
- Verify: matches screenshot; image doesn't distort at common widths (1280/1440/1920).

## Phase 4 — Trust strip

- `src/components/marketing/trust-strip.tsx`: 4-column glass card row, icon + label each, positioned to overlap hero/services boundary per design offsets.
- Verify: overlap positioning matches screenshot; icons render from downloaded assets (no inline hand-drawn SVGs).

## Phase 5 — Services section

- `src/components/marketing/services-section.tsx`: eyebrow/heading/"explore all" link + card grid.
- Data-driven card list (`title`, `description`, `icon`) seeded with the 2 real cards from Figma (Crash Repair, Dent Repair) only — per brief, cards 3–8 are not fabricated.
- Verify: 2-card grid renders correctly; grid CSS supports adding more cards later without markup changes (`grid-cols-4` etc., cards `min-h`/`self-start` per design).

## Phase 6 — Footer

- `src/components/marketing/footer.tsx`: brand column + social icons, Services nav, Company nav, Contact block, bottom bar.
- Verify: matches screenshot; contact details/links are static text (no functional mailto/tel required by design, but use `mailto:`/`tel:` hrefs since they're free correctness).

## Phase 7 — Assemble + metadata

- Replace `src/app/(marketing)/page.tsx` scaffold content with the assembled sections (Header/Hero/TrustStrip/Services/Footer) inside the marketing layout.
- Page-level `metadata` (title/description) updated to Vantage Autobody copy; root `layout.tsx` `APP_NAME`/JSON-LD left as-is (out of scope — app-wide branding is a separate decision).
- Verify: `yarn build` passes, marketing route still prerenders static (`○`), `yarn lint` clean.

## Phase 8 — Visual QA

- Run dev server, screenshot the live page, diff against the Figma export at the same viewport.
- Check responsive collapse points aren't required by design (Figma frame is fixed 1280px desktop) — confirm with user only if they want mobile/tablet breakpoints added (not in source design).

---

**Note:** phases execute in this session unless blocked; each phase is independently committable.
