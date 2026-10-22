import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import { composePublicSettings, PUBLIC_SETTINGS_KEYS, type PublicGlobals } from './public-settings';

const defaults = () =>
  Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((key) => [key, parseGlobal(key, {})])) as unknown as PublicGlobals;

describe('composePublicSettings blank list items', () => {
  it('drops list items whose primary text is blank, as the old forms did', () => {
    const g = defaults();
    g['page.insurance'].coordination.features.push({ title: '  ', description: 'orphan' });
    g['page.insurance'].steps.items.push({ label: '', description: 'orphan' });
    g['page.about'].team.members.push({ name: '', role: 'Nobody', image: null });
    g['page.about'].standards.items.push({ title: ' ', description: 'orphan' });

    const out = composePublicSettings(g);
    const base = composePublicSettings(defaults());
    expect(out.insuranceFeatures).toEqual(base.insuranceFeatures);
    expect(out.insuranceSteps).toEqual(base.insuranceSteps);
    expect(out.aboutTeamMembers).toEqual(base.aboutTeamMembers);
    expect(out.aboutStandardsItems).toEqual(base.aboutStandardsItems);
  });
});
