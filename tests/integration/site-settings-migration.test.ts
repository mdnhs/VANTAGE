import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { ABOUT_DEFAULTS, resolveAboutContent } from '@/features/about-page/defaults';
import { INSURANCE_DEFAULTS, resolveInsuranceContent } from '@/features/insurance-page/defaults';
import { PROCESS_PAGE_DEFAULTS, resolveProcessPageContent } from '@/features/process-page/defaults';
import { formatOpeningHoursSummary } from '@/lib/content/opening-hours';
import { GLOBALS, parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { auditLogs, revisions, siteSettings } from '@/server/db/schema';
import {
  composeLegacyView,
  FALLBACK_SETTINGS,
  PUBLIC_SETTINGS_KEYS,
  type PublicGlobals,
} from '@/server/lib/settings/public-settings';
import {
  LossyMigrationError,
  mapLegacyToDocs,
  resolvePublicGlobals,
  MIGRATION_NOTE,
  migrateSiteSettings,
  verifySiteSettingsMigration,
} from '@/server/lib/settings/site-settings-migration';
import { settingsRepository } from '@/server/repositories/settings-repository';

const wipe = () => db.execute(sql`truncate table settings, revisions, audit_logs, site_settings`);

// Every column filled in, already trimmed, free-text hours: what an edited site looks like.
const FULL = {
  businessName: 'Auto Paint Shop',
  phone: '+353 89 440 0191',
  emergencyPhone: '+353 89 440 0192',
  email: 'hello@autopaint.ie',
  address: '10, Park Street, Dublin 2, Ireland',
  openingHours: 'Mon–Fri: 8:00 – 18:00, Sat: 9:00 – 13:00',
  googleMapsUrl: 'https://maps.app.goo.gl/abc',
  whatsappNumber: '+353 89 440 0191',
  facebookUrl: 'https://www.facebook.com/autopaint',
  instagramUrl: 'https://www.instagram.com/autopaint',
  tiktokUrl: 'https://www.tiktok.com/@autopaint',
  linkedinUrl: 'https://www.linkedin.com/company/autopaint',
  logoPublicId: 'vantage/branding/logo',
  faviconPublicId: 'vantage/branding/favicon',
  logoLottieJson: '{"v":"5.5.2"}',
  logoUseLottie: true,
  heroVideoPublicId: 'vantage/hero/video',
  heroFallbackImagePublicId: 'vantage/hero/poster',
  heroVideoEnabled: true,
  metaTitle: 'Auto Paint Shop | Crash repair',
  metaDescription: 'Crash repair and respray in Dublin.',
  ogImagePublicId: 'vantage/seo/og',
  twitterHandle: '@autopaint',
  heroEyebrow: 'Premier respray specialists',
  heroHeadlineLine1: 'We Fix',
  heroHeadlineLine2: 'Your Ride',
  heroHeadlineAccent: 'Like New.',
  heroSubtext: 'Hero subtext.',
  trustBadge1Title: 'T1',
  trustBadge1Subtitle: 'S1',
  trustBadge2Title: 'T2',
  trustBadge2Subtitle: 'S2',
  trustBadge3Title: 'T3',
  trustBadge3Subtitle: 'S3',
  trustBadge4Title: 'T4',
  trustBadge4Subtitle: 'S4',
  catalogEyebrow: 'Catalog eyebrow',
  catalogHeadlineLine1: 'Catalog line',
  catalogHeadlineAccent: 'Catalog accent',
  catalogSubtext: 'Catalog subtext',
  servicesHeroEyebrow: 'Services eyebrow',
  servicesHeroHeadlineLine1: 'Services line',
  servicesHeroHeadlineAccent: 'Services accent',
  servicesHeroSubtext: 'Services subtext',
  ourWorkHeroEyebrow: 'Work eyebrow',
  ourWorkHeroHeadlineLine1: 'Work line',
  ourWorkHeroHeadlineAccent: 'Work accent',
  ourWorkHeroSubtext: 'Work subtext',
  insuranceHeroEyebrow: 'Ins eyebrow',
  insuranceHeroLine1: 'Ins 1',
  insuranceHeroLine2: 'Ins 2',
  insuranceHeroLine3: 'Ins 3',
  insuranceHeroSubtext: 'Ins subtext',
  insuranceCoordinationTitle: 'Coordination',
  insuranceCoordinationSubtext: 'Coordination subtext',
  insuranceFeatures: [{ title: 'F1', description: 'D1' }],
  insuranceStepsEyebrow: 'Steps eyebrow',
  insuranceStepsTitle: 'Steps title',
  insuranceSteps: [
    { label: 'One', description: 'First' },
    { label: 'Two', description: 'Second' },
  ],
  insuranceCtaLine1: 'Cta 1',
  insuranceCtaAccent: 'Cta accent',
  insuranceCtaSubtext: 'Cta subtext',
  insuranceDisclaimer: 'Disclaimer text.',
  aboutHeroEyebrow: 'About eyebrow',
  aboutHeroLine1: 'About 1',
  aboutHeroAccent1: 'Accent 1',
  aboutHeroLine2: 'About 2',
  aboutHeroAccent2: 'Accent 2',
  aboutHeroImagePublicId: 'vantage/about/hero',
  aboutHeritageTitle: 'Heritage',
  aboutHeritageText: 'Heritage text.',
  aboutHeritageStat1Value: '2001',
  aboutHeritageStat1Label: 'Est.',
  aboutHeritageStat2Value: '20+',
  aboutHeritageStat2Label: 'Years',
  aboutHeritageImagePublicId: 'vantage/about/heritage',
  aboutHeritageQuote: 'A quote.',
  aboutTeamTitle: 'Team',
  aboutTeamSubtext: 'Team subtext',
  aboutTeamMembers: [
    { name: 'Ann', role: 'Painter', imagePublicId: 'vantage/team/ann' },
    { name: 'Bob', role: 'Tech', imagePublicId: null },
  ],
  aboutStandardsEyebrow: 'Standards eyebrow',
  aboutStandardsTitle: 'Standards\ntitle',
  aboutStandardsImagePublicId: 'vantage/about/standards',
  aboutStandardsItems: [{ title: 'Std', description: 'Std desc' }],
  processPageEyebrow: 'Process eyebrow',
  processPageTitle: 'The {count} steps',
  processPageSubtext: 'Process subtext',
};

async function seed(over: Partial<typeof siteSettings.$inferInsert> = {}) {
  const [row] = await db
    .insert(siteSettings)
    .values({ id: 1, ...FULL, ...over })
    .returning();
  return row!;
}

async function composeFromKeys() {
  const docs: Record<string, unknown> = {};
  for (const key of PUBLIC_SETTINGS_KEYS) docs[key] = parseGlobal(key, (await settingsRepository.get(key))?.value);
  return composeLegacyView(docs as PublicGlobals);
}

// The complete flat shape of an untouched site: built-in copy for every column.
const DEFAULT_PUBLIC = {
  ...FALLBACK_SETTINGS,
  insuranceHeroEyebrow: INSURANCE_DEFAULTS.heroEyebrow,
  insuranceHeroLine1: INSURANCE_DEFAULTS.heroLine1,
  insuranceHeroLine2: INSURANCE_DEFAULTS.heroLine2,
  insuranceHeroLine3: INSURANCE_DEFAULTS.heroLine3,
  insuranceHeroSubtext: INSURANCE_DEFAULTS.heroSubtext,
  insuranceCoordinationTitle: INSURANCE_DEFAULTS.coordinationTitle,
  insuranceCoordinationSubtext: INSURANCE_DEFAULTS.coordinationSubtext,
  insuranceFeatures: INSURANCE_DEFAULTS.features,
  insuranceStepsEyebrow: INSURANCE_DEFAULTS.stepsEyebrow,
  insuranceStepsTitle: INSURANCE_DEFAULTS.stepsTitle,
  insuranceSteps: INSURANCE_DEFAULTS.steps,
  insuranceCtaLine1: INSURANCE_DEFAULTS.ctaLine1,
  insuranceCtaAccent: INSURANCE_DEFAULTS.ctaAccent,
  insuranceCtaSubtext: INSURANCE_DEFAULTS.ctaSubtext,
  insuranceDisclaimer: INSURANCE_DEFAULTS.disclaimer,
  aboutHeroEyebrow: ABOUT_DEFAULTS.heroEyebrow,
  aboutHeroLine1: ABOUT_DEFAULTS.heroLine1,
  aboutHeroAccent1: ABOUT_DEFAULTS.heroAccent1,
  aboutHeroLine2: ABOUT_DEFAULTS.heroLine2,
  aboutHeroAccent2: ABOUT_DEFAULTS.heroAccent2,
  aboutHeroImagePublicId: null,
  aboutHeritageTitle: ABOUT_DEFAULTS.heritageTitle,
  aboutHeritageText: ABOUT_DEFAULTS.heritageText,
  aboutHeritageStat1Value: ABOUT_DEFAULTS.heritageStat1Value,
  aboutHeritageStat1Label: ABOUT_DEFAULTS.heritageStat1Label,
  aboutHeritageStat2Value: ABOUT_DEFAULTS.heritageStat2Value,
  aboutHeritageStat2Label: ABOUT_DEFAULTS.heritageStat2Label,
  aboutHeritageImagePublicId: null,
  aboutHeritageQuote: ABOUT_DEFAULTS.heritageQuote,
  aboutTeamTitle: ABOUT_DEFAULTS.teamTitle,
  aboutTeamSubtext: ABOUT_DEFAULTS.teamSubtext,
  aboutTeamMembers: ABOUT_DEFAULTS.teamMembers,
  aboutStandardsEyebrow: ABOUT_DEFAULTS.standardsEyebrow,
  aboutStandardsTitle: ABOUT_DEFAULTS.standardsTitle,
  aboutStandardsImagePublicId: null,
  aboutStandardsItems: ABOUT_DEFAULTS.standardsItems,
  processPageEyebrow: PROCESS_PAGE_DEFAULTS.eyebrow,
  processPageTitle: PROCESS_PAGE_DEFAULTS.title,
  processPageSubtext: PROCESS_PAGE_DEFAULTS.subtext,
};

describe('site_settings -> versioned keys', () => {
  beforeEach(wipe);

  it('migrated keys compose back to exactly the legacy getPublic() output', async () => {
    const legacy = await seed();
    await migrateSiteSettings();

    const { id: _id, updatedAt: _updatedAt, ...expected } = legacy;
    expect(await composeFromKeys()).toEqual(expected);
    expect(await verifySiteSettingsMigration()).toEqual({ ok: true, checked: expect.any(Number), problems: [] });
  });

  it('resolved page props (about, insurance, process) match the legacy row', async () => {
    const legacy = await seed();
    await migrateSiteSettings();
    const composed = await composeFromKeys();

    expect(resolveAboutContent(composed)).toEqual(resolveAboutContent(legacy));
    expect(resolveInsuranceContent(composed)).toEqual(resolveInsuranceContent(legacy));
    expect(resolveProcessPageContent(composed)).toEqual(resolveProcessPageContent(legacy));
  });

  it('writes each key at version 1 with a system revision and audit row', async () => {
    await seed();
    const result = await migrateSiteSettings();

    expect(result.written).toBe(PUBLIC_SETTINGS_KEYS.length);
    for (const key of PUBLIC_SETTINGS_KEYS) {
      const row = await settingsRepository.get(key);
      expect(row?.version).toBe(1);
      expect(row?.updatedBy).toBeNull();
      expect(GLOBALS[key].safeParse(row?.value).success).toBe(true);
    }
    const revs = await db.select().from(revisions).where(eq(revisions.entityType, 'setting'));
    expect(revs).toHaveLength(PUBLIC_SETTINGS_KEYS.length);
    expect(revs.every((r) => r.version === 1 && r.note === MIGRATION_NOTE && r.createdBy === null)).toBe(true);
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, 'globals.migrate'));
    expect(logs).toHaveLength(PUBLIC_SETTINGS_KEYS.length);
    expect(logs.every((l) => l.actorId === null && l.summary === MIGRATION_NOTE)).toBe(true);
  });

  it('is idempotent: a re-run writes nothing', async () => {
    await seed();
    await migrateSiteSettings();
    const again = await migrateSiteSettings();

    expect(again.written).toBe(0);
    expect(again.skipped).toBe(PUBLIC_SETTINGS_KEYS.length);
    expect(again.plan.every((p) => p.action === 'skip')).toBe(true);
    expect((await settingsRepository.get('contact'))?.version).toBe(1);
    expect(await db.select().from(revisions)).toHaveLength(PUBLIC_SETTINGS_KEYS.length);
  });

  it('never overwrites a key an admin already saved, unless forced', async () => {
    await seed();
    await settingsRepository.save('site', { version: 0, value: { name: 'Edited in admin' } }, null);
    await migrateSiteSettings();
    expect((await settingsRepository.get('site'))?.value).toEqual({ name: 'Edited in admin' });

    const forced = await migrateSiteSettings({ force: true });
    expect(forced.plan.find((p) => p.key === 'site')).toMatchObject({ action: 'overwrite', version: 2 });
    const site = await settingsRepository.get('site');
    expect(site?.version).toBe(2);
    expect((site?.value as { name: string }).name).toBe('Auto Paint Shop');
  });

  it('dry run lists keys and field counts but writes nothing', async () => {
    await seed();
    const result = await migrateSiteSettings({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.plan.map((p) => p.key)).toEqual([...PUBLIC_SETTINGS_KEYS]);
    expect(result.plan.every((p) => p.action === 'create' && p.fields > 0)).toBe(true);
    expect(result.written).toBe(0);
    expect(await db.select().from(revisions)).toHaveLength(0);
    expect(await settingsRepository.get('contact')).toBeNull();
  });

  it('verify reports keys that are missing or that drifted from the legacy row', async () => {
    await seed();
    expect((await verifySiteSettingsMigration()).problems).toContain('contact: not migrated');

    await migrateSiteSettings();
    await settingsRepository.save('contact', { version: 1, value: { email: 'other@autopaint.ie' } }, null);
    const result = await verifySiteSettingsMigration();
    expect(result.ok).toBe(false);
    expect(result.problems.some((p) => p.startsWith('email:'))).toBe(true);
  });

  describe('with no legacy row', () => {
    it('writes nothing', async () => {
      const result = await migrateSiteSettings();
      expect(result).toMatchObject({ legacyRow: false, written: 0, plan: [] });
      expect(await settingsRepository.get('site')).toBeNull();
    });

    it('empty keys compose to the built-in defaults (FALLBACK_SETTINGS)', async () => {
      const composed = await composeFromKeys();
      expect(composed).toEqual(DEFAULT_PUBLIC);
      expect((await verifySiteSettingsMigration()).ok).toBe(true);
    });
  });

  describe('hours', () => {
    it('free text becomes the summary and is not parsed into weekly rows', async () => {
      const legacy = await seed({ openingHours: 'By appointment only' });
      await migrateSiteSettings();
      const contact = (await settingsRepository.get('contact'))!.value as {
        hours: { summary: string; weekly: unknown[] };
      };
      expect(contact.hours.summary).toBe('By appointment only');
      expect(contact.hours.weekly).toEqual([]);
      expect((await composeFromKeys()).openingHours).toBe(legacy.openingHours);
    });

    it('structured JSON becomes weekly rows and a summary that prints the same', async () => {
      const day = (d: string, short: string, isOpen: boolean, openTime: string, closeTime: string) => ({
        day: d,
        shortDay: short,
        isOpen,
        openTime,
        closeTime,
      });
      const structured = JSON.stringify([
        day('Monday', 'Mon', true, '08:00', '18:00'),
        day('Tuesday', 'Tue', true, '08:00', '18:00'),
        day('Wednesday', 'Wed', true, '08:00', '18:00'),
        day('Thursday', 'Thu', true, '08:00', '18:00'),
        day('Friday', 'Fri', true, '09:00', '17:00'),
        day('Saturday', 'Sat', false, '09:00', '14:00'),
        day('Sunday', 'Sun', false, '09:00', '14:00'),
      ]);
      await seed({ openingHours: structured });
      await migrateSiteSettings();

      const contact = (await settingsRepository.get('contact'))!.value as {
        hours: { summary: string; weekly: { days: number[]; opens: string; closes: string }[] };
      };
      expect(contact.hours.weekly).toEqual([
        { days: [1, 2, 3, 4], opens: '08:00', closes: '18:00' },
        { days: [5], opens: '09:00', closes: '17:00' },
      ]);
      // Nothing dropped: the site derives the text from the weekly rows.
      expect(contact.hours.summary).toBe('');
      expect((await composeFromKeys()).openingHours).toBe(formatOpeningHoursSummary(structured));
      expect((await verifySiteSettingsMigration()).ok).toBe(true);
    });

    it('an invalid row stays out of weekly, its text stays in the summary, and contact keeps its values', async () => {
      const structured = JSON.stringify([
        { day: 'Monday', shortDay: 'Mon', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'Saturday', shortDay: 'Sat', isOpen: true, openTime: '14:00', closeTime: '09:00' },
      ]);
      await seed({ openingHours: structured });
      const result = await migrateSiteSettings();

      const contact = (await settingsRepository.get('contact'))!.value as {
        email: string;
        hours: { summary: string; weekly: { days: number[] }[] };
      };
      // Days missing from the JSON are filled with the legacy defaults (Mon–Fri open), as the old page did.
      expect(contact.hours.weekly).toEqual([{ days: [1, 2, 3, 4, 5], opens: '08:00', closes: '18:00' }]);
      expect(contact.hours.summary).toContain('Sat: 14:00 – 09:00');
      expect(contact.email).toBe('hello@autopaint.ie');
      expect(result.warnings.some((w) => w.includes('closing must be after opening'))).toBe(true);
    });

    it('an empty legacy value stays empty (the site printed "Closed")', async () => {
      await seed({ openingHours: '' });
      await migrateSiteSettings();
      expect((await composeFromKeys()).openingHours).toBe('');
      expect(formatOpeningHoursSummary((await composeFromKeys()).openingHours)).toBe('Closed');
      expect((await verifySiteSettingsMigration()).ok).toBe(true);
    });
  });

  describe('values that do not fit the new schema', () => {
    it('are refused, with nothing written, unless --allow-lossy is passed', async () => {
      await seed({ insuranceSteps: [{ label: 'L'.repeat(90), description: 'cut' }], email: 'not-an-email' });
      await expect(migrateSiteSettings()).rejects.toBeInstanceOf(LossyMigrationError);
      expect(await db.select().from(revisions)).toHaveLength(0);
      expect(await settingsRepository.get('site')).toBeNull();

      const dry = await migrateSiteSettings({ dryRun: true });
      expect(dry.lossy.join('\n')).toContain('page.insurance.steps.items.0.label: truncated to 80');
      expect(dry.lossy.join('\n')).toContain('contact.email');
      expect(dry.written).toBe(0);
    });

    it('are repaired field by field with --allow-lossy, never by dropping the whole key', async () => {
      await seed({
        facebookUrl: 'not a url',
        insuranceSteps: [
          { label: 'Fine', description: 'ok' },
          { label: 'L'.repeat(90), description: 'long label is cut' },
        ],
      });
      const result = await migrateSiteSettings({ allowLossy: true });

      const site = (await settingsRepository.get('site'))!.value as { social: { label: string }[] };
      expect(site.social.map((s) => s.label)).toEqual(['Instagram', 'TikTok', 'LinkedIn']);
      const contact = (await settingsRepository.get('contact'))!.value as { email: string };
      expect(contact.email).toBe('hello@autopaint.ie');
      const insurance = (await settingsRepository.get('page.insurance'))!.value as {
        steps: { items: { label: string }[] };
      };
      expect(insurance.steps.items[1]!.label).toHaveLength(80);
      expect(result.lossy.join('\n')).toContain('site.social.0.url');
    });

    it('keeps http links and the exact address string, newlines included', async () => {
      const address = '10 Park Street\nDublin 2, Ireland';
      await seed({ facebookUrl: 'http://old.example/page', address });
      await migrateSiteSettings();
      const site = (await settingsRepository.get('site'))!.value as { social: { url: string }[] };
      expect(site.social[0]!.url).toBe('http://old.example/page');
      expect((await composeFromKeys()).address).toBe(address);
      expect((await verifySiteSettingsMigration()).ok).toBe(true);
    });

    it('blank copy columns fall back to the built-in copy, like the legacy `||` did', async () => {
      await seed({ heroEyebrow: '', catalogSubtext: null, aboutHeritageTitle: '   ', insuranceFeatures: [] });
      await migrateSiteSettings();
      const composed = await composeFromKeys();
      expect(composed.heroEyebrow).toBe(FALLBACK_SETTINGS.heroEyebrow);
      expect(composed.catalogSubtext).toBe(FALLBACK_SETTINGS.catalogSubtext);
      expect(resolveAboutContent(composed).heritageTitle).toBe('Our Heritage');
      expect(resolveInsuranceContent(composed).features).toHaveLength(3);
    });

    it('derived SEO values stay derived (null) so renames keep flowing through', async () => {
      await seed({ metaTitle: null, metaDescription: null });
      await migrateSiteSettings();
      const seo = (await settingsRepository.get('seo'))!.value as { defaultTitle: string; defaultDescription: string };
      expect([seo.defaultTitle, seo.defaultDescription]).toEqual(['', '']);
      const composed = await composeFromKeys();
      expect(composed.metaTitle).toBeNull();
      expect(composed.metaDescription).toBeNull();

      // Rename the business: the title/description derive from the new name, live.
      await settingsRepository.save('site', { version: 1, value: { name: 'Renamed Ltd' } }, null);
      const renamed = await composeFromKeys();
      expect(renamed.businessName).toBe('Renamed Ltd');
      expect(renamed.metaTitle).toBeNull();
      expect(renamed.metaDescription).toBeNull();
    });
  });

  it('maps the mapper output of a sparse row to a defaults-equal document', () => {
    const nulls = Object.fromEntries(
      Object.keys(FULL).map((k) => [k, null]),
    ) as unknown as typeof siteSettings.$inferSelect;
    const { docs } = mapLegacyToDocs({
      ...nulls,
      businessName: 'Vantage Autobody',
      phone: '+353 1 234 5678',
      email: 'info@vantageautobody.ie',
      address: 'Unit 4, Industrial Estate, Dublin Road, Ireland',
      openingHours: 'Mon–Fri: 8:00 – 18:00',
      logoUseLottie: false,
      heroVideoEnabled: false,
    });
    const parsed = Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((k) => [k, parseGlobal(k, docs[k])]));
    expect(composeLegacyView(parsed as PublicGlobals)).toEqual(DEFAULT_PUBLIC);
  });

  describe('deploy before migrate', () => {
    const none = Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((k) => [k, null])) as Parameters<
      typeof resolvePublicGlobals
    >[0];

    it('with no key rows, the public output deep-equals the legacy output', async () => {
      const legacy = await seed();
      const { id: _id, updatedAt: _updatedAt, ...expected } = legacy;
      expect(composeLegacyView(resolvePublicGlobals(none, legacy))).toEqual(expected);
    });

    it('structured hours, a newline address and blank optional columns still match', async () => {
      const structured = JSON.stringify(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => ({
          day,
          shortDay: day.slice(0, 3),
          isOpen: i < 5,
          openTime: '08:00',
          closeTime: '17:30',
        })),
      );
      const legacy = await seed({
        openingHours: structured,
        address: 'Unit 4\nDublin Road',
        emergencyPhone: null,
        whatsappNumber: '',
        facebookUrl: null,
        googleMapsUrl: null,
        metaTitle: null,
        metaDescription: null,
        ogImagePublicId: null,
        logoPublicId: null,
        insuranceFeatures: null,
        aboutTeamMembers: null,
        heroEyebrow: '',
      });
      const fromLegacy = composeLegacyView(resolvePublicGlobals(none, legacy));
      await migrateSiteSettings();
      const fromKeys = await composeFromKeys();
      expect(fromKeys).toEqual(fromLegacy);
      expect(fromKeys.address).toBe('Unit 4\nDublin Road');
      expect(formatOpeningHoursSummary(fromKeys.openingHours)).toBe(formatOpeningHoursSummary(structured));
      expect((await verifySiteSettingsMigration()).ok).toBe(true);
    });

    it('a stored key always wins over the legacy row', async () => {
      const legacy = await seed();
      const stored = { ...none, site: parseGlobal('site', { name: 'From keys' }) };
      const composed = composeLegacyView(resolvePublicGlobals(stored, legacy));
      expect(composed.businessName).toBe('From keys');
      expect(composed.phone).toBe(legacy.phone);
    });
  });

  it('--force leaves keys whose value is unchanged alone', async () => {
    await seed();
    await migrateSiteSettings();
    const forced = await migrateSiteSettings({ force: true });
    expect(forced.written).toBe(0);
    expect(forced.plan.every((p) => p.action === 'unchanged')).toBe(true);
    expect((await settingsRepository.get('site'))?.version).toBe(1);
  });
});
