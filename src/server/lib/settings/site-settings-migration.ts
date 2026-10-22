import { isDeepStrictEqual } from 'node:util';

import { inArray } from 'drizzle-orm';

import { db } from '@/server/db';
import { media } from '@/server/db/schema/media';

import { formatOpeningHoursSummary, parseOpeningHours, type DaySchedule } from '@/lib/content/opening-hours';
import { resolveAboutContent } from '@/features/about-page/content';
import { resolveInsuranceContent } from '@/features/insurance-page/content';
import { resolveProcessPageContent } from '@/features/process-page/content';
import { GLOBALS, parseGlobal, type GlobalKey } from '@/lib/content/globals';
import { cloudinaryImage, collectMediaIds, mapRefs } from '@/lib/content/image-ref';
import type { SiteSettings } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import {
  composeLegacyView,
  FALLBACK_SETTINGS,
  PUBLIC_SETTINGS_KEYS,
  type PublicGlobals,
  type PublicSettingsKey,
} from '@/server/lib/settings/public-settings';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { siteSettingsRepository } from '@/server/repositories/site-settings-repository';

// Legacy `site_settings` (one 90-column row) -> versioned `settings` documents.
// Blank columns are left out so the schema defaults (today's copy) apply. Values that
// do not fit the new schema are repaired field by field (truncated or dropped, with a
// warning) so one bad column can never make a whole key fall back to its defaults.

export const MIGRATION_NOTE = 'Migrated from site_settings';

type Legacy = SiteSettings;
type Json = Record<string, unknown>;

const t = (v: string | null | undefined) => v?.trim() || undefined;

// ------------------------------------------------------------------ mapping

function toE164(phone: string): string {
  let digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  return /^\+[1-9]\d{6,14}$/.test(digits) ? digits : '';
}

function mapHours(raw: string, warnings: string[]) {
  const text = raw.trim();
  if (!text) return { weekly: [], summary: '' };
  // Free text stays text: the structured rows only come from the structured JSON form.
  if (!text.startsWith('[')) return { weekly: [], summary: text };

  const schedule: DaySchedule[] = parseOpeningHours(text);
  const byTimes = new Map<string, { days: number[]; opens: string; closes: string }>();
  schedule.forEach((day, i) => {
    if (!day.isOpen) return;
    const key = `${day.openTime}-${day.closeTime}`;
    const row = byTimes.get(key) ?? { days: [], opens: day.openTime, closes: day.closeTime };
    row.days.push(i + 1);
    byTimes.set(key, row);
  });
  const weekly = [...byTimes.values()].filter((row) => {
    const ok = row.closes > row.opens;
    if (!ok) warnings.push(`contact.hours: dropped ${row.opens}-${row.closes} (closing must be after opening)`);
    return ok;
  });
  const summary = formatOpeningHoursSummary(schedule);
  // Nothing dropped: the weekly rows alone say it all and the site derives the text from them.
  if (weekly.length > 0 && weekly.length === byTimes.size) return { weekly, summary: '' };
  // Otherwise the summary keeps every day as it was printed, including rows left out of `weekly`.
  return { weekly, summary };
}

export type MigratedDocs = Record<PublicSettingsKey, Json>;

export function mapLegacyToDocs(row: Legacy): { docs: MigratedDocs; warnings: string[]; lossy: string[] } {
  const warnings: string[] = [];
  const lossy: string[] = [];
  const badge = (title: string | null, subtitle: string | null) => ({ title: t(title), subtitle: t(subtitle) });
  const defaults = GLOBALS['page.home'].parse({}).trustBadges;
  const hours = mapHours(row.openingHours, warnings);
  const socialLinks: [string, string | null][] = [
    ['Facebook', row.facebookUrl],
    ['Instagram', row.instagramUrl],
    ['TikTok', row.tiktokUrl],
    ['LinkedIn', row.linkedinUrl],
  ];
  const social = socialLinks.flatMap(([label, url]) => (t(url) ? [{ label, url: t(url) }] : []));

  const email = row.email.trim();
  if (email && !GLOBALS.contact.shape.email.safeParse(email).success) {
    lossy.push('contact.email: not a valid address; left empty');
  }
  const mapUrl = t(row.googleMapsUrl);

  const docs: MigratedDocs = {
    site: {
      name: t(row.businessName),
      logo: cloudinaryImage(t(row.logoPublicId)),
      favicon: cloudinaryImage(t(row.faviconPublicId)),
      lottieLogo: { enabled: row.logoUseLottie, json: row.logoLottieJson || null },
      social,
    },
    contact: {
      email: GLOBALS.contact.shape.email.safeParse(email).success ? email : '',
      phone: { display: row.phone.trim(), e164: toE164(row.phone) },
      emergencyPhone: t(row.emergencyPhone),
      whatsapp: t(row.whatsappNumber),
      // One line, exactly as typed (lines are capped at 500; a longer address is reported as lossy).
      address: { lines: row.address.trim() ? [row.address.trim()] : [] },
      hours,
      mapUrl,
    },
    seo: {
      // Blank = derived live from the site name / hours (the adapter maps blank to null).
      defaultTitle: row.metaTitle?.trim() ?? '',
      defaultDescription: row.metaDescription?.trim() ?? '',
      defaultOgImage: cloudinaryImage(t(row.ogImagePublicId)),
      twitterHandle: t(row.twitterHandle),
    },
    'page.home': {
      hero: {
        eyebrow: t(row.heroEyebrow),
        line1: t(row.heroHeadlineLine1),
        line2: t(row.heroHeadlineLine2),
        accent: t(row.heroHeadlineAccent),
        subtext: t(row.heroSubtext),
        video: cloudinaryImage(t(row.heroVideoPublicId)),
        fallbackImage: cloudinaryImage(t(row.heroFallbackImagePublicId)),
        videoEnabled: row.heroVideoEnabled,
      },
      trustBadges: [
        badge(row.trustBadge1Title, row.trustBadge1Subtitle),
        badge(row.trustBadge2Title, row.trustBadge2Subtitle),
        badge(row.trustBadge3Title, row.trustBadge3Subtitle),
        badge(row.trustBadge4Title, row.trustBadge4Subtitle),
      ].map((b, i) => ({ title: b.title ?? defaults[i]!.title, subtitle: b.subtitle ?? defaults[i]!.subtitle })),
      catalog: {
        eyebrow: t(row.catalogEyebrow),
        line1: t(row.catalogHeadlineLine1),
        accent: t(row.catalogHeadlineAccent),
        subtext: t(row.catalogSubtext),
      },
    },
    'page.services': {
      hero: {
        eyebrow: t(row.servicesHeroEyebrow),
        line1: t(row.servicesHeroHeadlineLine1),
        accent: t(row.servicesHeroHeadlineAccent),
        subtext: t(row.servicesHeroSubtext),
      },
    },
    'page.our-work': {
      hero: {
        eyebrow: t(row.ourWorkHeroEyebrow),
        line1: t(row.ourWorkHeroHeadlineLine1),
        accent: t(row.ourWorkHeroHeadlineAccent),
        subtext: t(row.ourWorkHeroSubtext),
      },
    },
    'page.insurance': {
      hero: {
        eyebrow: t(row.insuranceHeroEyebrow),
        line1: t(row.insuranceHeroLine1),
        line2: t(row.insuranceHeroLine2),
        line3: t(row.insuranceHeroLine3),
        subtext: t(row.insuranceHeroSubtext),
      },
      coordination: {
        title: t(row.insuranceCoordinationTitle),
        subtext: t(row.insuranceCoordinationSubtext),
        features: row.insuranceFeatures?.length ? row.insuranceFeatures : undefined,
      },
      steps: {
        eyebrow: t(row.insuranceStepsEyebrow),
        title: t(row.insuranceStepsTitle),
        items: row.insuranceSteps?.length ? row.insuranceSteps : undefined,
      },
      cta: {
        line1: t(row.insuranceCtaLine1),
        accent: t(row.insuranceCtaAccent),
        subtext: t(row.insuranceCtaSubtext),
      },
      disclaimer: t(row.insuranceDisclaimer),
    },
    'page.about': {
      hero: {
        eyebrow: t(row.aboutHeroEyebrow),
        line1: t(row.aboutHeroLine1),
        accent1: t(row.aboutHeroAccent1),
        line2: t(row.aboutHeroLine2),
        accent2: t(row.aboutHeroAccent2),
        image: cloudinaryImage(t(row.aboutHeroImagePublicId)),
      },
      heritage: {
        title: t(row.aboutHeritageTitle),
        text: t(row.aboutHeritageText),
        stat1: { value: t(row.aboutHeritageStat1Value), label: t(row.aboutHeritageStat1Label) },
        stat2: { value: t(row.aboutHeritageStat2Value), label: t(row.aboutHeritageStat2Label) },
        image: cloudinaryImage(t(row.aboutHeritageImagePublicId)),
        quote: t(row.aboutHeritageQuote),
      },
      team: {
        title: t(row.aboutTeamTitle),
        subtext: t(row.aboutTeamSubtext),
        members: row.aboutTeamMembers?.length
          ? row.aboutTeamMembers.map((m) => ({
              name: m.name,
              role: m.role,
              image: cloudinaryImage(t(m.imagePublicId)),
            }))
          : undefined,
      },
      standards: {
        eyebrow: t(row.aboutStandardsEyebrow),
        title: t(row.aboutStandardsTitle),
        image: cloudinaryImage(t(row.aboutStandardsImagePublicId)),
        items: row.aboutStandardsItems?.length ? row.aboutStandardsItems : undefined,
      },
    },
    'page.process': {
      eyebrow: t(row.processPageEyebrow),
      title: t(row.processPageTitle),
      subtext: t(row.processPageSubtext),
    },
  };
  return { docs, warnings, lossy };
}

// -------------------------------------------------------------- repair

function containerAt(root: unknown, path: PropertyKey[]): Record<PropertyKey, unknown> | undefined {
  let node = root as Record<PropertyKey, unknown> | undefined;
  for (const key of path) node = node?.[key] as Record<PropertyKey, unknown> | undefined;
  return node && typeof node === 'object' ? node : undefined;
}

// Validates `value` against the key's schema and repairs what does not fit: over-long
// strings are truncated (never the Lottie JSON), everything else is dropped (the whole
// array item when the problem sits inside one). Returns the parsed document to store.
export function repairToSchema(key: GlobalKey, value: unknown, lossy: string[]): unknown {
  const current = structuredClone(value);
  for (let pass = 0; pass < 12; pass++) {
    const result = GLOBALS[key].safeParse(current);
    if (result.success) return result.data;

    const removals: PropertyKey[][] = [];
    for (const issue of result.error.issues) {
      const path = issue.path;
      const label = `${key}.${path.join('.')}`;
      const parent = containerAt(current, path.slice(0, -1));
      const last = path[path.length - 1];
      const isLottie = path[path.length - 1] === 'json';
      if (issue.code === 'too_big' && issue.origin === 'string' && parent && last !== undefined && !isLottie) {
        const original = String(parent[last]);
        parent[last] = original.slice(0, Number(issue.maximum)).trim();
        lossy.push(`${label}: truncated to ${String(issue.maximum)} characters`);
        continue;
      }
      if (path.length === 0) throw new Error(`${key}: cannot repair root issue: ${issue.message}`);
      const firstIndex = path.findIndex((p) => typeof p === 'number');
      removals.push(firstIndex >= 0 ? path.slice(0, firstIndex + 1) : [...path]);
      lossy.push(`${label}: ${issue.message}; ${firstIndex >= 0 ? 'item dropped' : 'left to default'}`);
    }
    // Deepest and highest array index first so earlier removals do not shift later ones.
    removals
      .sort((a, b) => b.length - a.length || Number(b[b.length - 1]) - Number(a[a.length - 1]))
      .forEach((path) => {
        const parent = containerAt(current, path.slice(0, -1));
        const last = path[path.length - 1]!;
        if (Array.isArray(parent)) parent.splice(Number(last), 1);
        else if (parent) delete parent[last];
      });
  }
  throw new Error(`${key}: could not repair to schema`);
}

// ---------------------------------------------------------------- migrate

export type MigrationPlanRow = {
  key: PublicSettingsKey;
  action: 'create' | 'skip' | 'unchanged' | 'overwrite';
  fields: number;
  version?: number;
};
export type MigrationResult = {
  dryRun: boolean;
  legacyRow: boolean;
  plan: MigrationPlanRow[];
  written: number;
  skipped: number;
  warnings: string[];
  // Values the new schemas cannot hold as they are (truncated or dropped).
  lossy: string[];
};

export class LossyMigrationError extends Error {
  constructor(readonly lossy: string[]) {
    super(
      `Migration would lose data in ${lossy.length} place(s); nothing was written. Re-run with --allow-lossy to accept.`,
    );
  }
}

// Every document for a legacy row, validated and repaired, before anything is written.
export function buildDocs(row: Legacy) {
  const { docs, warnings, lossy } = mapLegacyToDocs(row);
  const repaired = {} as Record<PublicSettingsKey, Json>;
  for (const key of PUBLIC_SETTINGS_KEYS) repaired[key] = repairToSchema(key, docs[key], lossy) as Json;
  return { docs: repaired, warnings, lossy };
}

// Public reads before the migration has run (deploy-before-migrate): a key that was never
// saved is taken from the legacy row; once saved, the stored document always wins.
export function resolvePublicGlobals(
  stored: { [K in PublicSettingsKey]: PublicGlobals[K] | null },
  legacy: Legacy | null | undefined,
): PublicGlobals {
  const legacyDocs = legacy && PUBLIC_SETTINGS_KEYS.some((k) => stored[k] === null) ? buildDocs(legacy).docs : null;
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_SETTINGS_KEYS) out[key] = stored[key] ?? parseGlobal(key, legacyDocs?.[key]);
  return out as PublicGlobals;
}

export async function migrateSiteSettings({
  dryRun = false,
  force = false,
  allowLossy = false,
}: { dryRun?: boolean; force?: boolean; allowLossy?: boolean } = {}): Promise<MigrationResult> {
  const row = await siteSettingsRepository.get();
  if (!row) return { dryRun, legacyRow: false, plan: [], written: 0, skipped: 0, warnings: [], lossy: [] };

  // Compute and repair every document first: a failure leaves nothing half-written.
  const { docs, warnings, lossy } = buildDocs(row);
  if (lossy.length > 0 && !allowLossy && !dryRun) throw new LossyMigrationError(lossy);

  const plan: MigrationPlanRow[] = [];
  const writes: { key: PublicSettingsKey; value: Json; version: number; note: string }[] = [];
  for (const key of PUBLIC_SETTINGS_KEYS) {
    const existing = await settingsRepository.get(key);
    const value = docs[key];
    const fields = Object.keys(value).length;
    if (existing && !force) {
      plan.push({ key, action: 'skip', fields, version: existing.version });
    } else if (existing && isDeepStrictEqual(existing.value, value)) {
      plan.push({ key, action: 'unchanged', fields, version: existing.version });
    } else {
      plan.push({ key, action: existing ? 'overwrite' : 'create', fields, version: (existing?.version ?? 0) + 1 });
      writes.push({
        key,
        value,
        version: existing?.version ?? 0,
        note: existing ? `${MIGRATION_NOTE} (forced)` : MIGRATION_NOTE,
      });
    }
  }
  if (!dryRun) {
    for (const w of writes) {
      // System actor (null user): the revision and the audit row record "no person".
      await settingsRepository.save(w.key, { version: w.version, value: w.value }, null, w.note, (tx) =>
        audit(null, { action: 'globals.migrate', entityType: 'setting', entityId: w.key, summary: MIGRATION_NOTE }, tx),
      );
    }
  }
  return {
    dryRun,
    legacyRow: true,
    plan,
    written: dryRun ? 0 : writes.length,
    skipped: plan.length - writes.length,
    warnings,
    lossy,
  };
}

// ----------------------------------------------------------------- verify

const trim = (v: string | null | undefined) => (v ?? '').trim();

// Recursively trims strings (the new schema trims; whitespace never renders differently).
function deepTrim(v: unknown): unknown {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return v.map(deepTrim);
  if (v && typeof v === 'object') {
    // A blank image id and a missing one both render the bundled photo.
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, k === 'imagePublicId' && !deepTrim(x) ? null : deepTrim(x)]),
    );
  }
  return v;
}

const FALLBACK_TEXT = FALLBACK_SETTINGS as unknown as Record<string, string | null>;
// Copy columns: a blank value rendered the built-in copy before and still does.
const COPY_COLUMNS = Object.keys(FALLBACK_TEXT).filter(
  (k) =>
    /^(hero(Eyebrow|Headline|Subtext)|trustBadge|catalog|servicesHero|ourWorkHero)/.test(k) &&
    FALLBACK_TEXT[k] !== null,
);
const RAW_COLUMNS = [
  'businessName',
  'phone',
  'emergencyPhone',
  'email',
  'googleMapsUrl',
  'whatsappNumber',
  'facebookUrl',
  'instagramUrl',
  'tiktokUrl',
  'linkedinUrl',
  'logoPublicId',
  'faviconPublicId',
  'heroVideoPublicId',
  'heroFallbackImagePublicId',
  'ogImagePublicId',
  'twitterHandle',
] as const;

type View = Partial<SiteSettings>;

// What a visitor can see, derived from either the legacy row or the composed settings.
function visibleView(s: View): Record<string, unknown> {
  const get = (k: string) => s[k as keyof SiteSettings] as string | null | undefined;
  const name = trim(get('businessName'));
  const hours = trim(formatOpeningHoursSummary(get('openingHours')));
  const view: Record<string, unknown> = {
    address: trim(get('address')),
    hours,
    logoLottieJson: get('logoLottieJson') || null,
    logoUseLottie: Boolean(s.logoUseLottie),
    heroVideoEnabled: Boolean(s.heroVideoEnabled),
    seoTitle: trim(get('metaTitle')) || name,
    seoDescription: trim(get('metaDescription')) || `${name} — ${hours}`,
    about: deepTrim(resolveAboutContent(s)),
    insurance: deepTrim(resolveInsuranceContent(s)),
    process: deepTrim(resolveProcessPageContent(s)),
  };
  for (const k of RAW_COLUMNS) view[k] = trim(get(k));
  for (const k of COPY_COLUMNS) view[k] = trim(get(k)) || trim(FALLBACK_TEXT[k]);
  return view;
}

export type VerifyResult = { ok: boolean; checked: number; problems: string[] };

async function legacySourcesFor(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select({ id: media.id, source: media.legacySource }).from(media).where(inArray(media.id, ids));
  return new Map(
    rows.flatMap((r) => {
      const m = r.source ? /^cloudinary:(?:image|video):(.+)$/.exec(r.source) : null;
      return m ? [[r.id, m[1]!] as const] : [];
    }),
  );
}

export async function verifySiteSettingsMigration(): Promise<VerifyResult> {
  const row = await siteSettingsRepository.get();
  const problems: string[] = [];
  const docs: Record<string, unknown> = {};
  for (const key of PUBLIC_SETTINGS_KEYS) {
    const stored = await settingsRepository.get(key);
    if (!stored && row) problems.push(`${key}: not migrated`);
    docs[key] = parseGlobal(key, stored?.value);
  }
  // After media:migrate the documents name media rows. Map each row that came from Cloudinary
  // back to its source id so the legacy view still compares; a media row picked later has no
  // source and stays a genuine mismatch.
  const sources = await legacySourcesFor(collectMediaIds(docs));
  for (const key of PUBLIC_SETTINGS_KEYS) {
    docs[key] = mapRefs(docs[key], (ref) => {
      if (ref.kind !== 'media') return ref;
      const publicId = sources.get(ref.id);
      return publicId ? { kind: 'cloudinary' as const, publicId } : ref;
    });
  }
  const composed = composeLegacyView(docs as PublicGlobals);
  // No legacy row: the public site showed the built-in copy.
  const before = visibleView((row ?? FALLBACK_SETTINGS) as unknown as View);
  const after = visibleView(composed);
  for (const k of Object.keys(before)) {
    if (!isDeepStrictEqual(before[k], after[k])) {
      problems.push(
        `${k}: legacy ${JSON.stringify(before[k])?.slice(0, 120)} != keys ${JSON.stringify(after[k])?.slice(0, 120)}`,
      );
    }
  }
  return { ok: problems.length === 0, checked: Object.keys(before).length, problems };
}
