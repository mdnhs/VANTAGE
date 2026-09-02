# Contact — Plan (Vertical Phases)

Each phase renders a visibly verifiable increment of the real page. Build → view in browser → next.

## Phase 0 — Assets

- Download map screenshot + icons (location, WhatsApp, phone, email, upload-cloud, submit-arrow, visit-hours pin/clock) into `public/assets/marketing/`.
- Verify: files exist, non-zero size, correct real format (`file` check).

## Phase 1 — Route + header nav wiring

- `src/app/(marketing)/contact/page.tsx` scaffold rendering `MarketingHeader` + `MarketingFooter` only.
- Update `header.tsx`: "Contact" points at `/contact` instead of `#contact`.
- Verify: `/contact` renders header+footer, "Contact" nav item highlighted.

## Phase 2 — Get in Touch column

- `src/components/marketing/contact-info.tsx`: heading, subcopy, 3 glass info cards (Headquarters, Direct Line + real `wa.me` WhatsApp link, Email).
- Verify: matches Figma screenshot; WhatsApp link opens `https://wa.me/<number>` with the site's phone number.

## Phase 3 — Enquiry form

- `src/components/marketing/contact-form.tsx` (client component): controlled inputs for name/email/phone, a real `<select>` for service, a textarea, and a file picker (click + drag-and-drop) that lists selected filenames — no upload wiring (see brief non-goals).
- Verify: typing/selecting/dropping files all update visible state; submit button present but disclosed as a no-op.

## Phase 4 — Visit Us / map section

- `src/components/marketing/visit-us-section.tsx`: static map image + overlay hours card.
- Verify: matches screenshot; image is the real downloaded asset, not a live map embed (per brief non-goal).

## Phase 5 — Assemble + metadata

- Compose the two-column hero (info + form) and the Visit Us section into `contact/page.tsx`; add page `metadata`.
- Verify: `yarn build` passes, route prerenders static (`○`) despite the client-component form, `yarn lint` clean.

## Phase 6 — Visual QA

- Dev server + browser screenshot at 1440px, scrolled through fully, compare against Figma export.
- Manually test: fill form fields, select a service, drag a file onto the upload zone, confirm filename appears.

---

**Note:** phases execute in this session unless blocked; each phase is independently committable.
