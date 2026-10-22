import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveAboutContent, resolveAboutPageContent } from '@/features/about-page/content';
import { resolveInsuranceContent } from '@/features/insurance-page/content';
import { resolveProcessPageContent } from '@/features/process-page/content';
import { FALLBACK_SETTINGS, defaultPublicGlobals, PUBLIC_SETTINGS_KEYS } from '@/server/lib/settings/public-settings';

import { parseGlobal } from './globals';
import {
  ABOUT_DEFAULTS,
  INSURANCE_DEFAULTS,
  LEGACY_FALLBACK_SETTINGS,
  PROCESS_PAGE_DEFAULTS,
} from './legacy-defaults.fixture';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === 'node_modules' || name === '.next') return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('single source of default copy', () => {
  it('nothing imports the retired features/*-page/defaults modules', () => {
    const root = process.cwd();
    const files = [...walk(join(root, 'src')), ...walk(join(root, 'scripts'))].filter((f) => /\.(tsx?|mjs|js)$/.test(f));
    const re = /features\/(about|insurance|process)-page\/defaults/;
    const offenders = files.filter((f) => f !== __filename && re.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('FALLBACK_SETTINGS comes from the globals schemas', () => {
    expect(FALLBACK_SETTINGS.phone).toBe(parseGlobal('contact', undefined).phone.display);
    expect(FALLBACK_SETTINGS.businessName).toBe(parseGlobal('site', undefined).name);
  });

  it('defaultPublicGlobals covers every public key', () => {
    const d = defaultPublicGlobals();
    expect(Object.keys(d).sort()).toEqual([...PUBLIC_SETTINGS_KEYS].sort());
    for (const k of PUBLIC_SETTINGS_KEYS) expect(d[k]).toEqual(parseGlobal(k, undefined));
  });

  it('FALLBACK_SETTINGS equals the pre-refactor literals', () => {
    expect(FALLBACK_SETTINGS).toEqual(LEGACY_FALLBACK_SETTINGS);
  });

  it('page copy resolves byte-identical to the old defaults.ts literals', () => {
    expect(resolveAboutContent(null)).toEqual(ABOUT_DEFAULTS);
    expect(resolveInsuranceContent(null)).toEqual(INSURANCE_DEFAULTS);
    expect(resolveProcessPageContent(null)).toEqual(PROCESS_PAGE_DEFAULTS);
    expect(parseGlobal('page.process', undefined)).toEqual(PROCESS_PAGE_DEFAULTS);
    const page = resolveAboutPageContent({
      aboutHeroImage: null,
      aboutHeritageImage: null,
      aboutStandardsImage: null,
      aboutTeamMembers: [],
    });
    expect(page.teamMembers).toEqual(ABOUT_DEFAULTS.teamMembers.map((m) => ({ name: m.name, role: m.role, image: null })));
    expect(page.standardsItems).toEqual(ABOUT_DEFAULTS.standardsItems);
  });
});
