# Contact — Vantage Autobody — Brief

## Source

Figma: `Security Partners LTD (Copy)`, node `2035:1162` — "Contact - Vantage Autobody", dev-mode, pulled via local Figma MCP (`figma-local`).

## What

New page at `/contact` reusing the shared `MarketingHeader`/`MarketingFooter`. Two-column hero (heading + contact-info cards / enquiry form), plus a "Visit Us" map section.

## Sections (top → bottom)

1. **Header/Footer** — reused; header's "Contact" nav link becomes active on this route (currently a `#contact` anchor).
2. **Get in Touch** (left column) — 2-line heading ("Get In" solid / "Touch" salmon), subcopy, 3 glass info cards: Headquarters (address), Direct Line (phone number + a WhatsApp button), Email.
3. **Send an Enquiry** (right column, glass card) — real controlled form: First Name, Last Name, Email, Phone, Service Required (select), Message Details (textarea), Upload Images (optional drag-and-drop-styled picker), Submit button. "We aim to respond within 24 hours" note beside the submit button.
4. **Visit Us** — a map screenshot (Figma exports it as a static raster image, not a live embed) with an overlay card showing opening hours (Mon-Fri 08:00-18:00, Sat-Sun Closed).

## Behavior (in scope)

- Form fields are real controlled inputs (client component, local state) — matches the `get-a-quote` page's pattern.
- Service Required is a real `<select>` with the site's service categories.
- Image upload is a real file picker (click-to-browse + drag-and-drop), showing selected filenames — **no upload/backend**, since no endpoint exists yet (see non-goals).
- WhatsApp button is a real `https://wa.me/` link using the site's phone number.
- Submit button is present but has no backend to submit to yet (see non-goals) — clicking it is a no-op today, disclosed rather than faked.

## Visual language

Same fixed dark brand skin as the rest of the site — no new tokens. Form inputs use a slightly different surface (`#1a1a1a`) than the `get-a-quote` page's inputs (`#131313`), matching Figma exactly — not unified across the two forms, since they're deliberately distinct card contexts (this form sits inside its own glass card; the quote form's fields sit directly on the page's dark card).

## Assets

1 map screenshot + 5 icons (headquarters/location, WhatsApp, phone/direct-line, email, upload-cloud, submit-arrow, visit-us clock/pin — see plan for the exact count) downloaded to `public/assets/marketing/`. Header/footer/logo/social/contact assets reused as-is.

## Non-goals

- No live map embed (Google Maps/Mapbox) — static screenshot per the Figma export, matching the design's own approach (no interactive-map layer exists in the source).
- No functional form submission — no backend endpoint exists yet for contact enquiries.
- No actual file upload — the picker is real (selects and lists files client-side) but nothing is sent anywhere.
