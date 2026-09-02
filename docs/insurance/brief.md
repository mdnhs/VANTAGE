# Insurance Support — Vantage Autobody — Brief

## Source

Figma: `Security Partners LTD (Copy)`, node `2035:917` — "Insurance Support - Vantage Autobody", dev-mode, pulled via local Figma MCP (`figma-local`).

## What

New page at `/insurance` reusing the shared `MarketingHeader`/`MarketingFooter`. Covers the insurance-claims service: hero, 3 coordination features, a 7-step process timeline, a CTA band, and a legal disclaimer.

## Sections (top → bottom)

1. **Hero** — eyebrow ("Insurance Claims"), 3-line heading ("Accident Repair" solid, "Without The" / "Headache." muted), 4-line subcopy, "Talk to a Specialist" CTA; right side a portrait photo with a soft salmon blur glow behind its bottom-left corner.
2. **Seamless Coordination** (bg `#1c1b1b`) — heading + intro, 3 feature cards (Direct Insurer Communication, Courtesy Car Coordination, Transparent Estimates) in a bento layout where the middle card is offset upward, matching the homepage services-grid stagger pattern.
3. **7 Steps to Perfection** — centered eyebrow + heading, a 7-step process timeline (Report → Insurer Contact → Assessment → Approval → Repair → Quality Control → Return), each step a numbered circle + label + 2-line description. Figma lays this out as an exact-pixel 4-over-3 zigzag with a connecting line (desktop-only per its own layer name) — **implemented as a simplified responsive 4-col/3-col two-row grid with a decorative connector line**, not pixel-matched to Figma's absolute coordinates, since replicating the exact stagger math isn't worth the fragility for a 7-item list.
4. **CTA band** (bg `#353534`) — heading ("Ready To Hand Over" / salmon "The Keys?"), subcopy, two buttons: "Talk to Our Specialists" (filled) and "Upload Estimate" (outlined).
5. **Disclaimer** — small centered legal copy about courtesy vehicles and the "Right to Choose" directive.
6. **Header/Footer** — reused; header's "Insurance" nav link becomes active on this route (currently a `#insurance` anchor).

## Content (from Figma — real content)

**Hero subcopy:** "We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider."

**Features:**

| Feature                      | Description                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct Insurer Communication | We bypass the middleman, speaking directly with loss adjusters and assessors to approve your claim faster using specialized industry channels. |
| Courtesy Car Coordination    | Never be left stranded. We arrange premium replacement vehicles immediately while yours is undergoing its comprehensive restoration.           |
| Transparent Estimates        | Blueprint-level breakdowns of parts, labor, and paint. Total clarity for you and unarguable technical justification for the insurer.           |

**7 steps:**

1. Report — Drop off your vehicle or let us recover it securely to our facility.
2. Insurer Contact — We open the dialogue with your provider to establish the claim.
3. Assessment — 3D laser scanning and structural diagnostics form a complete blueprint.
4. Approval — Technical justification secures rapid, uncompromised authorization.
5. Repair — Our master technicians execute precision bodywork and flawless respraying.
6. Quality Control — Micron-level paint depth checks and strict safety calibrations.
7. Return — Vehicle handed back fully valeted, certified, and guaranteed.

**Disclaimer:** "Disclaimer: courtesy vehicle provision is subject to availability and your specific insurance policy terms. Vantage Autobody operates independently and is legally entitled to repair vehicles insured by all major providers under the 'Right to Choose' directive. Terms and conditions apply."

## Visual language

Same fixed dark brand skin as the rest of the site — no new tokens. New neutral surface `#353534` for the CTA band (distinct from the `#1c1b1b`/`#131313` grays used elsewhere).

## Assets

1 new hero photo + 3 feature icons + 2 CTA button icons downloaded to `public/assets/marketing/`. The decorative background glow behind the hero photo is pure CSS (blurred rounded div), no asset. Header/footer/logo/social/contact assets reused as-is.

## Non-goals

- "Talk to a Specialist" / "Talk to Our Specialists" CTAs point at `/get-a-quote` (closest existing funnel entry point) rather than a dedicated contact form — no such form exists yet.
- "Upload Estimate" is a static button — no file upload functionality exists yet.
- The 7-step timeline's connector line is decorative only; not pixel-matched to Figma's exact zigzag coordinates (see Sections above).
