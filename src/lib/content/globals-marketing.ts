import * as z from 'zod';

import { CUSTOM_SCRIPT_HOSTS } from '@/lib/tracking/hosts';
import { GA4_ID, GTM_ID, PIXEL_ID } from '@/lib/tracking/ids';

// Self-contained on purpose: globals.ts imports this file, so nothing here may
// import from './globals' (it would be a cycle). `s` and `Href` mirror its helpers.
const s = (max: number, fallback = '') => z.string().trim().max(max).default(fallback);

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

// ----------------------------------------------------------------- consent

const REQUIRED_WHEN_ENABLED = ['title', 'body', 'accept', 'reject', 'customise', 'save', 'settingsLink'] as const;

export const ConsentGlobal = z
  .object({
    enabled: z.boolean().default(false),
    title: s(80, 'Cookies on this site'),
    body: s(
      600,
      'We use analytics and marketing cookies to understand how the site is used and to measure our adverts. They are only set if you allow them. Necessary cookies keep the site working.',
    ),
    accept: s(30, 'Accept all'),
    reject: s(30, 'Reject all'),
    customise: s(30, 'Customise'),
    save: s(30, 'Save choices'),
    settingsLink: s(30, 'Cookie settings'),
    policyLabel: s(40, 'Privacy policy'),
    policyHref: Href,
    categories: z
      .object({
        necessary: s(300, 'Needed for the site to work, such as remembering your cookie choice. Always on.'),
        analytics: s(300, 'Google Analytics, to count visits and see which pages help (through Google Tag Manager).'),
        marketing: s(300, 'Meta (Facebook) Pixel and ad measurement, to see whether our adverts lead to enquiries.'),
      })
      .prefault({}),
    // At least every 6 months.
    reconsentMonths: z.number().int().min(1).max(6).default(6),
    // Raising it asks every visitor again.
    version: z.number().int().min(1).default(1),
  })
  .superRefine((v, ctx) => {
    // A live banner needs every label, and withdrawal needs the footer link.
    if (!v.enabled) return;
    for (const key of REQUIRED_WHEN_ENABLED) {
      if (!v[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Fill this in before turning the banner on',
        });
      }
    }
  });

// ----------------------------------------------------------- custom scripts

export const SCRIPT_CATEGORIES = ['necessary', 'analytics', 'marketing'] as const;

const RoutePattern = z
  .string()
  .trim()
  .max(120)
  .regex(/^\/[\w\-/]*\*?$/, 'Use a path like "/" or "/services/*"');

export const allowedSrc = (src: string): boolean => {
  try {
    const url = new URL(src);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      CUSTOM_SCRIPT_HOSTS.includes(url.hostname)
    );
  } catch {
    return false;
  }
};

export const ScriptSnippet = z
  .object({
    name: s(60),
    placement: z.enum(['head', 'body']).default('body'),
    src: z.string().trim().max(500).default(''),
    inline: z.string().max(20_000).default(''),
    category: z.enum(SCRIPT_CATEGORIES).default('marketing'),
    routes: z.array(RoutePattern).max(20).default([]),
    enabled: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (Boolean(v.src) === Boolean(v.inline.trim())) {
      ctx.addIssue({
        code: 'custom',
        path: ['src'],
        message: 'Give either a script address or inline code, not both',
      });
    } else if (v.src && !allowedSrc(v.src)) {
      ctx.addIssue({
        code: 'custom',
        path: ['src'],
        message:
          CUSTOM_SCRIPT_HOSTS.length === 0
            ? 'External scripts are not allowed yet; use inline code'
            : `Use https on an allowed host: ${CUSTOM_SCRIPT_HOSTS.join(', ')}`,
      });
    }
  });
export type ScriptSnippet = z.infer<typeof ScriptSnippet>;

export const ScriptsGlobal = z.object({
  snippets: z.array(ScriptSnippet).max(20).default([]),
});

// ---------------------------------------------------------------- tracking

// A refine, not .or(z.literal('')): a union would report "Invalid input"
// instead of the format hint.
const optionalId = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === '' || pattern.test(v), message)
    .default('');

// A settings row with dedicated endpoints, not a versioned global: it is not in
// GLOBALS (no generic API, no revisions), because a snapshot would hold the
// ciphertext of the Conversions API token.
export const TrackingSettings = z.object({
  gtmId: optionalId(GTM_ID, 'Use the GTM-XXXXXXX format'),
  ga4Id: optionalId(GA4_ID, 'Use the G-XXXXXXXXXX format'),
  metaPixelId: optionalId(PIXEL_ID, 'Use the 10-20 digit Pixel ID'),
  // v1.<iv>.<tag>.<ciphertext>; never sent to the browser.
  capiTokenEncrypted: z.string().max(2000).nullable().default(null),
  testEventCode: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Z0-9]*$/, 'Use the code from Events Manager (letters and digits)')
    .default(''),
  enabled: z
    .object({
      gtm: z.boolean().default(false),
      ga4: z.boolean().default(false),
      meta: z.boolean().default(false),
      capi: z.boolean().default(false),
    })
    .prefault({}),
  // Owner only, with a recorded acknowledgement.
  enhancedMatching: z
    .object({
      enabled: z.boolean().default(false),
      acknowledgedAt: z.iso.datetime().nullable().default(null),
      acknowledgedBy: z.string().max(254).nullable().default(null),
    })
    .prefault({}),
});
export type TrackingValue = z.infer<typeof TrackingSettings>;

export function parseTracking(value: unknown): TrackingValue {
  const parsed = TrackingSettings.safeParse(value ?? {});
  if (parsed.success) return parsed.data;
  // Same drift policy as parseGlobal: defaults keep the site up.
  console.warn('[content] tracking settings are invalid; using defaults', z.prettifyError(parsed.error));
  return TrackingSettings.parse({});
}

// ------------------------------------------------------------ registration

export const MARKETING_GLOBALS = { consent: ConsentGlobal, scripts: ScriptsGlobal } as const;
export const MARKETING_PUBLIC_KEYS = ['consent', 'scripts'] as const;
