// @vitest-environment happy-dom
// @vitest-environment-options {"url":"https://vantageautobody.ie/"}
import { cleanup, render, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONSENT_COOKIE, cookieValue, decodeConsent, encodeConsent } from '@/lib/tracking/consent';

import { ConsentBanner } from './consent-banner';

// The beacon is the only network call; nothing else leaves the page.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}')),
  );
  vi.stubGlobal('navigator', { ...navigator, sendBeacon: undefined });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
});

const copy = {
  title: 'Cookies on this site',
  body: 'Body',
  accept: 'Accept all',
  reject: 'Reject all',
  customise: 'Customise',
  save: 'Save choices',
  policyLabel: 'Privacy policy',
  policyHref: '',
  categories: { necessary: 'N', analytics: 'A', marketing: 'M' },
};
const policy = { version: 1, months: 6 };

describe('ConsentBanner with the real cookie rules', () => {
  it('opens when there is no cookie, and Reject all stores a:0 m:0', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload, hostname: 'localhost' });
    render(<ConsentBanner copy={copy} policy={policy} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reject all' }));
    const stored = decodeConsent(cookieValue(document.cookie, CONSENT_COOKIE));
    expect(stored).toMatchObject({ v: 1, a: 0, m: 0 });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays closed with a valid current cookie', () => {
    const value = encodeConsent({ id: 'abc', v: 1, ts: Math.floor(Date.now() / 1000) - 60, a: 1, m: 0 });
    document.cookie = `${CONSENT_COOKIE}=${value}; Path=/`;
    render(<ConsentBanner copy={copy} policy={policy} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens again for an older policy version', () => {
    const value = encodeConsent({ id: 'abc', v: 1, ts: Math.floor(Date.now() / 1000) - 60, a: 1, m: 0 });
    document.cookie = `${CONSENT_COOKIE}=${value}; Path=/`;
    render(<ConsentBanner copy={copy} policy={{ version: 2, months: 6 }} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
