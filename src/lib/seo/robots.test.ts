import { describe, expect, it } from 'vitest';

import { robotsFor, siteEnvFrom } from './robots';

describe('siteEnvFrom', () => {
  it('defaults to development', () => {
    expect(siteEnvFrom({})).toBe('development');
  });
  it('treats Vercel production as production', () => {
    expect(siteEnvFrom({ VERCEL_ENV: 'production' })).toBe('production');
  });
  it('lets SITE_ENV win', () => {
    expect(siteEnvFrom({ SITE_ENV: 'staging', VERCEL_ENV: 'production' })).toBe('staging');
  });
  it('ignores an unknown SITE_ENV', () => {
    expect(siteEnvFrom({ SITE_ENV: 'prod' })).toBe('development');
  });
});

describe('robotsFor', () => {
  it('blocks everything outside production', () => {
    expect(robotsFor('staging', { robots: 'index' }, 'https://x.ie')).toEqual({
      rules: { userAgent: '*', disallow: '/' },
    });
  });

  it('serves the sitemap and host in production', () => {
    const r = robotsFor('production', { robots: 'index' }, 'https://x.ie/');
    expect(r.sitemap).toBe('https://x.ie/sitemap.xml');
    expect(r.host).toBe('https://x.ie');
    expect(r.rules).toEqual([
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/login', '/unauthorized', '/maintenance', '/*?*'],
      },
    ]);
  });

  it('blocks everything when the site is set to noindex', () => {
    const r = robotsFor('production', { robots: 'noindex' }, 'https://x.ie');
    expect(r.rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(r.sitemap).toBeUndefined();
  });
});
