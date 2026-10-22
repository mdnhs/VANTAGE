// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

const state = vi.hoisted(() => ({
  settings: {} as Record<string, unknown>,
  tracking: { gtmId: null, ga4Id: null, pixelId: null } as Record<string, string | null>,
  disabled: false,
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('next/script', () => ({
  default: (props: { id: string; children?: string }) => <script data-testid={props.id}>{props.children}</script>,
}));
vi.mock('@/lib/env', () => ({ serverEnv: () => ({ DISABLE_CUSTOM_SCRIPTS: state.disabled }) }));
vi.mock('@/server/queries/get-setting', () => ({
  getSetting: async (key: 'consent' | 'scripts') => parseGlobal(key, state.settings[key]),
}));
vi.mock('@/server/queries/get-public-tracking', () => ({ getPublicTracking: async () => state.tracking }));

import { CookieSettingsSlot } from './cookie-settings-slot';
import { MarketingTracking } from './marketing-tracking';

const necessary = { name: 's', inline: 'window.x=1', category: 'necessary', enabled: true };

beforeEach(() => {
  state.settings = {};
  state.tracking = { gtmId: null, ga4Id: null, pixelId: null };
  state.disabled = false;
});
afterEach(cleanup);

describe('MarketingTracking renders null when inactive', () => {
  it('for the defaults', async () => {
    expect(await MarketingTracking()).toBeNull();
    expect(await CookieSettingsSlot()).toBeNull();
  });

  it('for the banner on with nothing to consent to', async () => {
    state.settings = { consent: { enabled: true } };
    expect(await MarketingTracking()).toBeNull();
    expect(await CookieSettingsSlot()).toBeNull();
  });

  it('for a tracker enabled with the banner off', async () => {
    state.tracking = { gtmId: 'GTM-TEST123', ga4Id: null, pixelId: '1234567890' };
    expect(await MarketingTracking()).toBeNull();
    expect(await CookieSettingsSlot()).toBeNull();
  });
});

describe('MarketingTracking when active', () => {
  beforeEach(() => {
    state.settings = { consent: { enabled: true } };
    state.tracking = { gtmId: 'GTM-TEST123', ga4Id: null, pixelId: null };
  });

  it('emits the bootstrap and the banner, with GTM only inside the bootstrap', async () => {
    const { container } = render(await MarketingTracking());
    const bootstrap = container.querySelector('script#vantage-tracking');
    expect(bootstrap).not.toBeNull();
    expect(bootstrap!.innerHTML).toContain('GTM-TEST123');
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(container.querySelector('script[src]')).toBeNull();
  });

  it('shows the Cookie settings button in the footer slot', async () => {
    render(await CookieSettingsSlot());
    const button = screen.getByRole('button', { name: 'Cookie settings' });
    expect(button.hasAttribute('data-cookie-settings')).toBe(true);
    expect(button.getAttribute('type')).toBe('button');
  });
});

describe('custom scripts', () => {
  it('a necessary snippet renders without the banner or any tracker', async () => {
    state.settings = { scripts: { snippets: [necessary] } };
    const { container } = render(await MarketingTracking());
    expect(container.querySelector('script#vantage-tracking')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('vantage-code-0').textContent).toBe('window.x=1');
  });

  it('DISABLE_CUSTOM_SCRIPTS removes it', async () => {
    state.settings = { scripts: { snippets: [necessary] } };
    state.disabled = true;
    expect(await MarketingTracking()).toBeNull();
  });
});
