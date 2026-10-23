import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

type Rule = { source: string; headers: { key: string; value: string }[] };

// Next applies matching rules in order; for one header key the last wins.
async function framing(path: string) {
  const rules = (await nextConfig.headers!()) as Rule[];
  const match = (source: string) => new RegExp(`^${source.replace(/\/:path\*/g, '(?:/.*)?')}$`).test(path);
  const out: Record<string, string> = {};
  for (const rule of rules) {
    if (!match(rule.source)) continue;
    for (const h of rule.headers) out[h.key] = h.value;
  }
  return out;
}

describe('frame headers', () => {
  it('lets the public site be framed by itself only', async () => {
    const h = await framing('/');
    expect(h['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(h['Content-Security-Policy']).toBe("frame-ancestors 'self'");
  });

  it.each(['/dashboard', '/dashboard/appearance', '/api/v1/preview', '/login', '/account/security', '/two-factor'])(
    'denies framing of %s',
    async (path) => {
      const h = await framing(path);
      expect(h['X-Frame-Options']).toBe('DENY');
      expect(h['Content-Security-Policy']).toBe("frame-ancestors 'none'");
    },
  );

  it('keeps the sandbox CSP on uploads (the last matching rule wins)', async () => {
    const h = await framing('/uploads/vantage/a/b.jpg');
    expect(h['Content-Security-Policy']).toBe("default-src 'none'; sandbox; frame-ancestors 'self'");
    expect(h['X-Frame-Options']).toBe('SAMEORIGIN');
    const rules = (await nextConfig.headers!()) as Rule[];
    const last = rules.filter((r) => r.headers.some((x) => x.key === 'Content-Security-Policy')).at(-1)!;
    expect(last.source).toBe('/uploads/:path*');
  });

  it('keeps the other security headers everywhere', async () => {
    const h = await framing('/dashboard');
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['Strict-Transport-Security']).toContain('max-age=63072000');
  });
});
