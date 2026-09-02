# Our Work (Portfolio) — Plan (Vertical Phases)

Each phase renders a visibly verifiable increment of the real page. Build → view in browser → next.

## Phase 0 — Assets

- Download 8 project photos (4 after + 4 before) + 2 icons (external-link corner, load-more arrow) into `public/assets/marketing/`.
- Verify: files exist, non-zero size.

## Phase 1 — Route + header nav wiring

- `src/app/(marketing)/our-work/page.tsx` scaffold rendering `MarketingHeader` + `MarketingFooter` only.
- Update `header.tsx`: "Our Work" points at `/our-work`, "Home" points at `/`; header becomes a client component using `usePathname` so the active-link highlight is correct on both routes (currently hardcoded to Home).
- Verify: `/our-work` renders header+footer, "Our Work" nav item highlighted; homepage still highlights "Home".

## Phase 2 — Portfolio hero

- `src/components/marketing/portfolio-hero.tsx`: eyebrow, 2-line heading (2nd line muted-pink per design, not the salmon accent used elsewhere), subcopy.
- Verify: matches Figma screenshot at 1280+ width.

## Phase 3 — Filter pills

- `src/components/marketing/portfolio-filters.tsx`: horizontal scrollable pill row, "All" pre-styled active (filled + glow), rest outlined. Static (see brief non-goals).
- Verify: matches screenshot; row scrolls horizontally on narrow viewports instead of wrapping/overflowing.

## Phase 4 — Project grid

- `src/components/marketing/project-grid.tsx`: data-driven array (4 real projects from brief.md), 2-col bento grid replicating Figma's stagger (2nd column offset down, alternating card aspect ratios: 4:3, 3:4, 4:5, 16:9).
- Each card: badge, corner link icon, title/subtitle, before/after cross-fade on hover (stacked `<Image>`s + `group-hover:opacity-0`/`opacity-100`, no JS).
- Verify: grid stagger matches screenshot at desktop width; hover swaps to the correct before-photo per card; images use real downloaded assets (no placeholders).

## Phase 5 — Load more + assemble

- Static "Load More Projects" button under the grid.
- Assemble all sections into `our-work/page.tsx`, add page `metadata` (title/description).
- Verify: `yarn build` passes, route prerenders static (`○`), `yarn lint` clean.

## Phase 6 — Visual QA

- Dev server + browser screenshot, compare against Figma export at 1440px viewport.
- Confirm header/footer container-width fixes from the homepage (edge-to-edge 48px, no `max-w-1280` cap) carry over correctly since both pages share the same `MarketingHeader`/`MarketingFooter`.

---

**Note:** phases execute in this session unless blocked; each phase is independently committable.
