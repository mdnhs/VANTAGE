import { describe, expect, it } from 'vitest';

import { redactForAudit } from './redact-for-audit';

describe('redactForAudit', () => {
  const site = { name: 'X', lottieLogo: { enabled: true, json: '{"v":"5"}' } };

  it('replaces the lottie json with its length and sha256', () => {
    const out = redactForAudit('site', site) as typeof site & { lottieLogo: { json: unknown } };
    expect(out.name).toBe('X');
    expect(out.lottieLogo.enabled).toBe(true);
    expect(out.lottieLogo.json).toEqual({ length: 9, sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(JSON.stringify(out)).not.toContain('"v"');
  });

  it('leaves other keys, empty json and missing values alone', () => {
    expect(redactForAudit('contact', site)).toBe(site);
    const none = { lottieLogo: { enabled: false, json: null } };
    expect(redactForAudit('site', none)).toBe(none);
    expect(redactForAudit('site', undefined)).toBeUndefined();
  });
});
