import * as z from 'zod';

import { imageRefSchema, videoRefSchema } from './image-ref';
import { SEO_PAGE_GLOBALS, SEO_PAGE_KEYS } from './globals-seo';
import { MARKETING_GLOBALS, MARKETING_PUBLIC_KEYS } from './globals-marketing';

// One zod schema per versioned global (a row of the `settings` table). Every
// field defaults to today's public copy, so `parseGlobal(key, {})` renders the
// current site (docs: Phase 4 Global Constraints). Isomorphic: the admin forms
// derive their fields from these schemas.

const s = (max: number, fallback = '') => z.string().trim().max(max).default(fallback);

// Text the admin types for a number: blank, or a number within the range (no comma decimals).
const numberText = (max: number, min: number, upper: number, whole = false) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) =>
        v === '' ||
        (/^-?\d+(\.\d+)?$/.test(v) &&
          Number(v) >= min &&
          Number(v) <= upper &&
          (!whole || Number.isInteger(Number(v)))),
      `Enter a number from ${min} to ${upper}${whole ? ' (whole)' : ''}, using a dot for decimals`,
    )
    .default('');

// Internal paths, anchors, mailto/tel and http(s) links; '' = not set.
const HREF = /^(\/|#|https:\/\/|http:\/\/|mailto:|tel:)\S*$/;
const Href = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === '' || HREF.test(v),
    'Use a path like /services, #section, mailto:, tel: or a full http(s):// address',
  )
  .default('');
const HttpsUrl = z
  .string()
  .trim()
  .max(1000)
  .regex(/^https?:\/\/\S+$/, 'Use a full http(s):// address');
const Link = z.object({ label: s(60), href: Href });
const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM, e.g. 08:00');
// ISO weekday: 1 = Monday … 7 = Sunday.
const Day = z.number().int().min(1).max(7);
const image = () => imageRefSchema.default(null);
const video = () => videoRefSchema.default(null);

const titled = (max: number) => z.object({ title: s(max), description: s(500) });

// ---------------------------------------------------------------- identity

export const SiteGlobal = z.object({
  // Blank shows the site's domain (siteNameFrom); the real name is set in the admin.
  name: s(255),
  legalName: s(120),
  // Switches the Insurance page and every insurance wording on the site and in the AI chat.
  features: z
    .object({
      insurance: z.boolean().default(false),
    })
    .prefault({}),
  logo: image(),
  favicon: image(),
  // Animated logo (Lottie JSON); falls back to `logo` when off or missing.
  lottieLogo: z
    .object({
      enabled: z.boolean().default(false),
      json: z.string().max(2_000_000).nullable().default(null),
    })
    .prefault({}),
  social: z
    .array(z.object({ label: s(40), url: HttpsUrl }))
    .max(10)
    .default([]),
});

// Field order follows the settings tabs: phone and email, address and map, opening hours.
export const ContactGlobal = z.object({
  phone: z
    .object({
      display: s(50, '+353 1 234 5678'),
      e164: z
        .string()
        .regex(/^(\+[1-9]\d{6,14})?$/, 'Use E.164, e.g. +35312345678')
        .default('+35312345678'),
    })
    .prefault({}),
  emergencyPhone: s(50),
  email: z.email().or(z.literal('')).default(''),
  whatsapp: s(50),
  address: z
    .object({
      lines: z.array(s(500)).max(4).default(['Unit 4, Industrial Estate, Dublin Road, Ireland']),
      city: s(60),
      eircode: s(10),
      country: s(60),
    })
    .prefault({}),
  mapUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), 'Use a full http(s):// address')
    .default(''),
  hours: z
    .object({
      weekly: z
        .array(
          z
            .object({ days: z.array(Day).min(1).max(7), opens: Time, closes: Time })
            .refine((r) => r.closes > r.opens, { path: ['closes'], message: 'Closing time must be after opening' }),
        )
        .max(7)
        .default([{ days: [1, 2, 3, 4, 5], opens: '08:00', closes: '18:00' }]),
      // How the site prints the hours; the structured list feeds JSON-LD.
      summary: s(500, 'Mon–Fri: 8:00 – 18:00'),
      note: s(200),
      // The last row of the opening-hours card on the Contact page, e.g. "Crash line only". Blank hides it.
      bankHolidays: s(100),
    })
    .prefault({}),
});

export const NavigationGlobal = z.object({
  // `mobileOnly` links are listed in the mobile menu but not the desktop bar.
  links: z
    .array(Link.extend({ mobileOnly: z.boolean().default(false) }))
    .max(7)
    .default([
      { label: 'Home', href: '/', mobileOnly: false },
      { label: 'Services', href: '/services', mobileOnly: false },
      { label: 'Our Work', href: '/our-work', mobileOnly: false },
      { label: 'Insurance', href: '/insurance', mobileOnly: false },
      { label: 'Contact', href: '/contact', mobileOnly: false },
      { label: 'About', href: '/about', mobileOnly: true },
      { label: 'Process', href: '/process', mobileOnly: true },
    ]),
  cta: z
    .object({
      label: s(60, 'Get a Free Quote'),
      href: Href.default('/get-a-quote'),
      // The mobile menu shows a wider button to the quote form.
      // Shown below the sm breakpoint.
      shortLabel: s(30, 'Free Quote'),
      mobileLabel: s(60, 'Request Free Quote Online'),
      mobileHref: Href.default('/get-a-quote'),
    })
    .prefault({}),
});

// Field order follows the footer on the page: brand, link columns, contact column, bottom bar.
export const FooterGlobal = z.object({
  blurb: s(
    300,
    'Excellence in precision automotive restoration and high-end repair since 1998. Your vehicle, our obsession.',
  ),
  // Icons under the blurb: each is a name, an address and an uploaded icon.
  socials: z
    .array(z.object({ name: s(40), url: HttpsUrl, icon: image() }))
    .max(12)
    .default([]),
  columns: z
    .array(z.object({ title: s(40), links: z.array(Link).max(10).default([]) }))
    .max(4)
    .default([
      {
        title: 'Services',
        links: [
          { label: 'Collision repair', href: '/services' },
          { label: 'Precision respraying', href: '/services' },
          { label: 'Classic restoration', href: '/services' },
          { label: 'Dent removal', href: '/services' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'Our process', href: '/process' },
          { label: 'Insurance partners', href: '/insurance' },
          { label: 'Showcase', href: '/our-work' },
          { label: 'About us', href: '/about' },
        ],
      },
    ]),
  contactNote: s(200),
  // Blank prints the site name, exactly as the footer did before this was editable.
  copyrightName: s(80),
  // Printed after the copyright name.
  legalNote: s(120, 'Registered in Ireland.'),
  legalLinks: z
    .array(Link)
    .max(6)
    // Legal pages themselves are listed from Dashboard → Legal pages, after these.
    .default([{ label: 'Login', href: '/login' }]),
});

// ------------------------------------------------------------------- forms

export const QuoteFormGlobal = z.object({
  labels: z
    .object({
      whatsapp: s(40, 'Your WhatsApp Number'),
      photos: s(80, 'Upload Damage Photos (Up to 4 Angles)'),
    })
    .prefault({}),
  placeholders: z
    .object({
      whatsapp: s(60, '+353 87 123 4567'),
    })
    .prefault({}),
  hints: z
    .object({
      whatsapp: s(120, 'We reply on WhatsApp with your estimate'),
      photoPrompt: s(120, 'Tap to upload photos or drag & drop here'),
      photoTypes: s(80, 'JPEG, PNG or HEIC · Max 25MB'),
    })
    .prefault({}),
  buttons: z
    .object({
      submit: s(60, 'Send my free quote request'),
      submitting: s(60, 'Submitting request…'),
      another: s(60, '← Submit another request'),
      whatsapp: s(40, 'WhatsApp photos'),
    })
    .prefault({}),
  responseTime: s(80, 'Average response time: 48 minutes'),
  noCard: s(60, 'No card required'),
  benefits: z
    .array(z.object({ title: s(80), body: s(200) }))
    .max(5)
    .default([
      { title: 'No-obligation & 100% free', body: 'Clear breakdown of parts, labour and paint costs.' },
      { title: 'Direct insurance support', body: 'We work directly with your insurer so you are not out of pocket.' },
      { title: 'Replacement car provision', body: 'Keep moving while your vehicle is in our Dublin workshop.' },
    ]),
  privacyNote: s(240, 'Privacy guarantee: your number and photos are used only for your quote.'),
  success: z
    .object({
      title: s(80, 'Quote request received'),
      // {phone} is replaced.
      body: s(
        400,
        'Thank you! Our Dublin master technicians have your photos. We will message you on WhatsApp at {phone} within 48 minutes with your estimate.',
      ),
    })
    .prefault({}),
  errors: z
    .object({
      required: s(160, 'Please add your WhatsApp number and at least one photo.'),
      generic: s(160, 'Failed to submit quote request. Please try again.'),
    })
    .prefault({}),
});

export const ContactFormGlobal = z.object({
  title: s(80, 'Send an enquiry'),
  intro: s(240, 'Provide details about your vehicle and repair needs for an accurate assessment.'),
  labels: z
    .object({
      firstName: s(40, 'First Name'),
      lastName: s(40, 'Last Name'),
      email: s(40, 'Email Address'),
      phone: s(40, 'Phone Number'),
      service: s(60, 'Service Required'),
      message: s(60, 'Message Details'),
      photos: s(60, 'Upload Images (Optional)'),
    })
    .prefault({}),
  placeholders: z
    .object({
      firstName: s(60, 'John'),
      lastName: s(60, 'Doe'),
      email: s(60, 'john@example.com'),
      phone: s(30, '+353 ...'),
      service: s(60, 'Select a service...'),
      other: s(40, 'Other'),
      message: s(160, 'Describe the damage or required work...'),
    })
    .prefault({}),
  dropzone: z
    .object({
      prompt: s(120, 'Tap to upload photos or drag & drop here'),
      hint: s(80, 'JPG or PNG · Max 5MB per file'),
    })
    .prefault({}),
  button: s(40, 'Submit enquiry'),
  submitting: s(40, 'Submitting…'),
  whatsappButton: s(40, 'WhatsApp photos'),
  responseNote: s(120, 'We aim to respond to all enquiries within 24 hours.'),
  sendAnother: s(60, '← Send another message'),
  success: z
    .object({
      title: s(80, 'Enquiry received'),
      // {name} is replaced.
      body: s(
        300,
        'Thank you, {name}! We have received your message. Our Dublin specialists will review your enquiry and get back to you within 24 hours.',
      ),
    })
    .prefault({}),
  errors: z
    .object({
      required: s(160, 'Please fill in all required fields.'),
      generic: s(160, 'Failed to submit enquiry. Please try again.'),
    })
    .prefault({}),
});

export const MicrocopyGlobal = z.object({
  contactInfo: z
    .object({
      eyebrow: s(40, 'Contact details'),
      title: s(40, 'Talk to'),
      accent: s(40, 'the team.'),
      headquarters: s(30, 'Headquarters'),
      directLine: s(30, 'Direct line'),
      email: s(30, 'Email'),
      whatsapp: s(30, 'WhatsApp us'),
    })
    .prefault({}),
  visitUs: z
    .object({
      intro: s(160, 'Opening hours and directions to our Dublin workshop.'),
      // The opening-hours card beside the map.
      hoursTitle: s(40, 'Opening hours'),
      openNow: s(20, 'Open now'),
      closedNow: s(20, 'Closed now'),
      closedDay: s(20, 'Closed'),
      bankHolidaysLabel: s(40, 'Bank holidays'),
      directionsLabel: s(40, 'Get directions'),
    })
    .prefault({}),
});

// -------------------------------------------------------------- operations

export const NotificationsGlobal = z.object({
  recipients: z.array(z.email()).max(10).default([]),
  // Privacy by default: the enquiry text stays out of email unless switched on.
  includeMessage: z.boolean().default(false),
  autoReply: z
    .object({
      enabled: z.boolean().default(false),
      subject: s(120),
      body: s(2000),
    })
    .prefault({}),
});

// The live chat AI assistant. Off until an owner switches it on; it also needs an AI provider
// to be set up under AI assistant settings.
export const SupportBotGlobal = z.object({
  enabled: z.boolean().default(false),
  botName: s(40, 'AI assistant'),
  extraInstructions: s(1000),
  maxAiReplies: z.number().int().min(1).max(100).default(30),
});

export const PrivacyGlobal = z.object({
  enquiryRetentionMonths: z.number().int().min(1).max(120).default(24),
  spamRetentionDays: z.number().int().min(1).max(365).default(30),
});

const SeoToken = z
  .string()
  .trim()
  .max(100)
  .regex(/^[A-Za-z0-9_-]*$/, 'Paste only the code, not the whole tag')
  .default('');

export const SeoGlobal = z.object({
  titleTemplate: z
    .string()
    .trim()
    .max(60)
    .refine((v) => v === '' || v.includes('%s'), 'The template needs "%s"')
    .default(''),
  defaultTitle: s(255),
  defaultDescription: s(500),
  defaultOgImage: image(),
  twitterHandle: s(50),
  robots: z.enum(['index', 'noindex']).default('index'),
  // Which of the four addresses (http/https, with/without www) is the real one; the others 301 to it.
  preferredHost: z.enum(['off', 'apex', 'www']).default('off'),
  // Site-ownership codes: the code only, never the whole <meta> tag.
  verification: z
    .object({
      google: SeoToken,
      bing: SeoToken,
    })
    .prefault({}),
  // Feeds the business JSON-LD on the home page.
  business: z
    .object({
      type: z.enum(['AutoBodyShop', 'AutoRepair', 'LocalBusiness']).default('AutoBodyShop'),
      priceRange: s(10),
      sameAs: z.array(HttpsUrl).max(10).default([]),
      // Local-search details for the business schema; blank fields are left out of it.
      areaServed: z.array(s(80)).max(10).default([]),
      latitude: numberText(20, -90, 90),
      longitude: numberText(20, -180, 180),
      ratingValue: numberText(5, 1, 5),
      reviewCount: numberText(7, 1, 9_999_999, true),
    })
    .prefault({}),
  // /llms.txt: a plain-text guide to the site for AI assistants (ChatGPT, Perplexity, Claude ...).
  llms: z
    .object({
      enabled: z.boolean().default(true),
      summary: s(1000),
    })
    .prefault({}),
});

// ------------------------------------------------------------ website pages

const heroTitled = (fallback: { eyebrow: string; line1: string; accent: string; subtext: string }) =>
  z
    .object({
      eyebrow: s(200, fallback.eyebrow),
      line1: s(100, fallback.line1),
      accent: s(100, fallback.accent),
      subtext: s(2000, fallback.subtext),
    })
    .prefault({});

export const HomePageGlobal = z.object({
  hero: z
    .object({
      eyebrow: s(200, "Ireland's Premier Collision & Respray Specialists"),
      line1: s(100, 'We Restore'),
      line2: s(100, 'Your Car'),
      accent: s(100, 'To Its Best.'),
      subtext: s(
        2000,
        'Manufacturer-standard accident repair, computerized laser chassis realignment, certified spray painting, and bespoke automotive restoration in Dublin. Your vehicle, our obsession.',
      ),
      video: video(),
      fallbackImage: image(),
      videoEnabled: z.boolean().default(false),
    })
    .prefault({}),
  trustBadges: z
    .array(z.object({ title: s(100), subtitle: s(150) }))
    .min(4)
    .max(4)
    .default([
      { title: '4.9★ Google Rated', subtitle: '180+ Dublin Reviews' },
      { title: 'Direct Insurer Billing', subtitle: 'AXA, Allianz, Zurich' },
      { title: 'Lifetime Paint Warranty', subtitle: 'Standox & PPG Systems' },
      { title: 'Courtesy Replacement', subtitle: 'Cars Available On-Site' },
    ]),
  catalog: heroTitled({
    eyebrow: 'Specialist Autobody Divisions',
    line1: 'From Damage To',
    accent: 'Showroom Finish.',
    subtext:
      'Comprehensive automotive bodywork, structural restoration, and cosmetic refinement using factory-approved techniques.',
  }),
  // The heading beside the quote form further down the homepage.
  quoteSection: heroTitled({
    eyebrow: '2-Minute Online Quotation',
    line1: "Show us the damage. We'll",
    accent: 'provide the cost.',
    subtext:
      'No need to take time off work or drive in with damage. Upload three photos and our Dublin estimators will issue an itemised, insurer-compatible quote with estimated completion dates.',
  }),
});

export const ServicesPageGlobal = z.object({
  // Same background media as the homepage banner: a photo, or a video over it when switched on.
  hero: z
    .object({
      eyebrow: s(200, 'Master Craftsmanship'),
      line1: s(100, 'Professional Bodywork.'),
      accent: s(100, 'Precision Finish.'),
      subtext: s(
        2000,
        'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
      ),
      video: video(),
      fallbackImage: image(),
      videoEnabled: z.boolean().default(false),
    })
    .prefault({}),
  faq: z
    .object({
      eyebrow: s(100, 'Good to Know'),
      title: s(160, 'Frequently Asked'),
      accent: s(100, 'Questions.'),
      items: z
        .array(z.object({ question: s(200), answer: s(1000) }))
        .max(20)
        .default([
          {
            question: 'Can you deal with my insurance company directly?',
            answer:
              'Yes. We speak directly with your insurer, loss adjusters and assessors, and handle the claim paperwork so you do not have to.',
          },
          {
            question: 'Will I have a car while mine is being repaired?',
            answer: 'We can arrange a courtesy car for you while your vehicle is in the workshop.',
          },
          {
            question: 'How do I get an estimate?',
            answer:
              'Request a free quote online with your vehicle details and a few photos, or call in to the workshop for an inspection. Estimates come with a clear breakdown of parts, labour and paint.',
          },
        ]),
    })
    .prefault({}),
});

export const OurWorkPageGlobal = z.object({
  // Background media like the homepage banner; the banner stays plain dark until one is added.
  hero: z
    .object({
      eyebrow: s(200, 'Portfolio'),
      line1: s(100, 'Our Recent'),
      accent: s(100, 'Restorations.'),
      subtext: s(
        2000,
        'Explore a curated selection of our most challenging and rewarding projects. Precision engineering meets master craftsmanship.',
      ),
      video: video(),
      fallbackImage: image(),
      videoEnabled: z.boolean().default(false),
    })
    .prefault({}),
});

export const InsurancePageGlobal = z.object({
  hero: z
    .object({
      eyebrow: s(200, 'Insurance Claims'),
      line1: s(100, 'Accident Repair'),
      line2: s(100, 'Without The'),
      line3: s(100, 'Headache.'),
      subtext: s(
        2000,
        'We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider.',
      ),
      // Same background media as the homepage banner: a photo, or a video over it when switched on.
      video: video(),
      fallbackImage: image(),
      videoEnabled: z.boolean().default(false),
    })
    .prefault({}),
  coordination: z
    .object({
      title: s(160, 'Seamless Coordination'),
      subtext: s(
        2000,
        'Our concierge-level claims service is designed to eliminate friction at every step of the repair journey.',
      ),
      features: z
        .array(titled(120))
        .max(6)
        .default([
          {
            title: 'Direct Insurer Communication',
            description:
              'We bypass the middleman, speaking directly with loss adjusters and assessors to approve your claim faster using specialized industry channels.',
          },
          {
            title: 'Courtesy Car Coordination',
            description:
              'Never be left stranded. We arrange premium replacement vehicles immediately while yours is undergoing its comprehensive restoration.',
          },
          {
            title: 'Transparent Estimates',
            description:
              'Blueprint-level breakdowns of parts, labor, and paint. Total clarity for you and unarguable technical justification for the insurer.',
          },
        ]),
    })
    .prefault({}),
  steps: z
    .object({
      eyebrow: s(100, 'The Methodology'),
      title: s(160, '7 Steps to Perfection'),
      items: z
        .array(z.object({ label: s(80), description: s(300) }))
        .max(12)
        .default([
          { label: 'Report', description: 'Drop off your vehicle or let us recover it securely to our facility.' },
          { label: 'Insurer Contact', description: 'We open the dialogue with your provider to establish the claim.' },
          {
            label: 'Assessment',
            description: '3D laser scanning and structural diagnostics form a complete blueprint.',
          },
          { label: 'Approval', description: 'Technical justification secures rapid, uncompromised authorization.' },
          {
            label: 'Repair',
            description: 'Our master technicians execute precision bodywork and flawless respraying.',
          },
          { label: 'Quality Control', description: 'Micron-level paint depth checks and strict safety calibrations.' },
          { label: 'Return', description: 'Vehicle handed back fully valeted, certified, and guaranteed.' },
        ]),
    })
    .prefault({}),
  cta: z
    .object({
      line1: s(100, 'Ready to Hand Over'),
      accent: s(100, 'The Keys?'),
      subtext: s(
        2000,
        "Connect with our claims team. We'll outline your options in five minutes and set the gears in motion immediately.",
      ),
    })
    .prefault({}),
  disclaimer: s(
    2000,
    "Disclaimer: courtesy vehicle provision is subject to availability and your specific insurance policy terms. We operate independently and are legally entitled to repair vehicles insured by all major providers under the 'Right to Choose' directive. Terms and conditions apply.",
  ),
});

export const AboutPageGlobal = z.object({
  hero: z
    .object({
      eyebrow: s(200, 'About Us'),
      line1: s(100, 'Built on'),
      accent1: s(100, 'Craft'),
      line2: s(100, 'Driven by'),
      accent2: s(100, 'Quality'),
      image: image(),
      // The photo above is the video's poster; the video plays over it when switched on.
      video: video(),
      videoEnabled: z.boolean().default(false),
    })
    .prefault({}),
  heritage: z
    .object({
      title: s(160, 'Our Heritage'),
      text: s(
        2000,
        "Founded in 1998, we began with a singular obsession: to elevate automotive repair from a trade to a precision craft. What started as a modest two-bay garage specializing in classic restorations has evolved into Ireland's premier high-end collision and repair facility.",
      ),
      stat1: z.object({ value: s(40, '1998'), label: s(80, 'Est.') }).prefault({}),
      stat2: z.object({ value: s(40, '25+'), label: s(80, 'Years of Precision') }).prefault({}),
      image: image(),
      quote: s(
        2000,
        "We don't just fix cars; we restore the engineering integrity and aesthetic perfection of every vehicle that crosses our threshold.",
      ),
    })
    .prefault({}),
  team: z
    .object({
      title: s(160, 'The Precision Team'),
      subtext: s(
        2000,
        'Our facility is only as good as the hands that operate it. We employ master technicians, ATA-accredited painters, and certified chassis alignment specialists.',
      ),
      members: z
        .array(z.object({ name: s(120), role: s(120), image: image() }))
        .max(12)
        .default([
          { name: "Declan O'Rourke", role: 'Master Technician', image: null },
          { name: 'Siobhan Gallagher', role: 'Lead Refinisher', image: null },
          { name: 'Liam Murphy', role: 'Diagnostics & Calibration', image: null },
        ]),
    })
    .prefault({}),
  standards: z
    .object({
      eyebrow: s(100, 'Facility & Tech'),
      title: s(160, 'Uncompromising\nStandards'),
      image: image(),
      items: z
        .array(titled(160))
        .max(8)
        .default([
          {
            title: 'Laser Chassis Alignment',
            description:
              'Using millimeter-perfect computerized jigs to return structural integrity to factory specifications post-collision.',
          },
          {
            title: 'Climate-Controlled Spray Booths',
            description:
              'Downdraft technology ensures a dust-free environment for flawless, baked-on finishes that match OEM standards perfectly.',
          },
          {
            title: 'NCT Compliant & Insurance Approved',
            description:
              'We work directly with major insurers. All structural repairs guarantee full NCT compliance and roadworthiness.',
          },
        ]),
    })
    .prefault({}),
});

export const ProcessPageGlobal = z.object({
  eyebrow: s(200, 'Predictable & Certified Workflow'),
  // `{count}` is replaced with the number of enabled steps.
  title: s(160, 'Our {count}-Step Car Repair Process'),
  subtext: s(
    2000,
    'From initial digital triage to strict multi-point handoff inspection, every step is transparently logged.',
  ),
  // Background media like the homepage banner; the banner stays plain dark until one is added.
  video: video(),
  fallbackImage: image(),
  videoEnabled: z.boolean().default(false),
});

export const ContactPageGlobal = z.object({
  // Background media like the homepage banner; the banner stays plain dark until one is added.
  hero: z
    .object({
      eyebrow: s(200, 'Visit · Call · Message'),
      line1: s(100, 'Get in'),
      accent: s(100, 'touch.'),
      subtext: s(
        2000,
        'We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask technical questions.',
      ),
      video: video(),
      fallbackImage: image(),
      videoEnabled: z.boolean().default(false),
    })
    .prefault({}),
});

export const QuotePageGlobal = z.object({
  // Background media like the homepage banner; the banner stays plain dark until one is added.
  hero: z
    .object({
      eyebrow: s(200, 'Free Online Quotation'),
      line1: s(100, 'Get your repair'),
      accent: s(100, 'quote.'),
      subtext: s(
        2000,
        'Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation estimate from our master technicians.',
      ),
      video: video(),
      fallbackImage: image(),
      videoEnabled: z.boolean().default(false),
    })
    .prefault({}),
});

export const GLOBALS = {
  site: SiteGlobal,
  contact: ContactGlobal,
  navigation: NavigationGlobal,
  footer: FooterGlobal,
  quoteForm: QuoteFormGlobal,
  contactForm: ContactFormGlobal,
  microcopy: MicrocopyGlobal,
  notifications: NotificationsGlobal,
  privacy: PrivacyGlobal,
  supportBot: SupportBotGlobal,
  seo: SeoGlobal,
  'page.home': HomePageGlobal,
  'page.services': ServicesPageGlobal,
  'page.our-work': OurWorkPageGlobal,
  'page.insurance': InsurancePageGlobal,
  'page.about': AboutPageGlobal,
  'page.process': ProcessPageGlobal,
  'page.contact': ContactPageGlobal,
  'page.get-a-quote': QuotePageGlobal,
  ...MARKETING_GLOBALS,
  ...SEO_PAGE_GLOBALS,
} as const;

export type GlobalKey = keyof typeof GLOBALS;
export type GlobalValue<K extends GlobalKey> = z.infer<(typeof GLOBALS)[K]>;

// Read by the public site. Notification recipients and retention windows are
// operator-only and never leave the server.
export const PUBLIC_GLOBAL_KEYS = [
  'site',
  'contact',
  'navigation',
  'footer',
  'quoteForm',
  'contactForm',
  'microcopy',
  'seo',
  'page.home',
  'page.services',
  'page.our-work',
  'page.insurance',
  'page.about',
  'page.process',
  'page.contact',
  'page.get-a-quote',
  ...MARKETING_PUBLIC_KEYS,
  ...SEO_PAGE_KEYS,
] as const satisfies readonly GlobalKey[];
export type PublicGlobalKey = (typeof PUBLIC_GLOBAL_KEYS)[number];

export function parseGlobal<K extends GlobalKey>(key: K, value: unknown): GlobalValue<K> {
  // Zod fills missing fields with shared default objects; clone so a caller's mutation never
  // leaks into the defaults used by later requests.
  const parsed = GLOBALS[key].safeParse(value ?? {});
  if (parsed.success) return structuredClone(parsed.data) as GlobalValue<K>;
  // Writes are validated, so this is drift (a hand edit, a schema change).
  // Defaults keep the site up; the admin shows them and the next save heals.
  console.warn(`[content] global "${key}" is invalid; using defaults`, z.prettifyError(parsed.error));
  return structuredClone(GLOBALS[key].parse({})) as GlobalValue<K>;
}
