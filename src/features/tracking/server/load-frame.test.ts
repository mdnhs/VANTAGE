import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

const state = vi.hoisted(() => ({
  settings: {} as Record<string, unknown>,
  tracking: { gtmId: null, ga4Id: null, pixelId: null } as Record<string, string | null>,
  disabled: false,
}));

vi.mock('@/lib/env', () => ({ serverEnv: () => ({ DISABLE_CUSTOM_SCRIPTS: state.disabled }) }));
vi.mock('@/server/queries/get-setting', () => ({
  getSetting: async (key: 'consent' | 'scripts') => parseGlobal(key, state.settings[key]),
}));
vi.mock('@/server/queries/get-public-tracking', () => ({ getPublicTracking: async () => state.tracking }));

import { loadTrackingFrame } from './load-frame';

const snippet = { name: 's', inline: 'window.x=1', category: 'necessary', enabled: true };

beforeEach(() => {
  state.settings = {};
  state.tracking = { gtmId: null, ga4Id: null, pixelId: null };
  state.disabled = false;
});

describe('loadTrackingFrame', () => {
  it('is inactive with no scripts for the defaults', async () => {
    const { frame, consent } = await loadTrackingFrame();
    expect(frame).toMatchObject({ active: false, scripts: [], gtmId: null, ga4Id: null, pixelId: null });
    expect(consent.enabled).toBe(false);
  });

  it('is active with the banner on and GTM set', async () => {
    state.settings = { consent: { enabled: true } };
    state.tracking = { gtmId: 'GTM-TEST123', ga4Id: 'G-TEST123', pixelId: null };
    const { frame } = await loadTrackingFrame();
    expect(frame).toMatchObject({ active: true, gtmId: 'GTM-TEST123', ga4Id: 'G-TEST123' });
  });

  it('drops every snippet when DISABLE_CUSTOM_SCRIPTS is on', async () => {
    state.settings = { scripts: { snippets: [snippet] } };
    expect((await loadTrackingFrame()).frame.scripts).toHaveLength(1);
    state.disabled = true;
    expect((await loadTrackingFrame()).frame.scripts).toEqual([]);
  });
});
