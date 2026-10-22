import type { MetadataRoute } from 'next';

export type SiteEnv = 'production' | 'staging' | 'development';

// SITE_ENV wins; without it Vercel's production deployment counts as production (today's rule).
export function siteEnvFrom(env: { SITE_ENV?: string; VERCEL_ENV?: string }): SiteEnv {
  const site = env.SITE_ENV;
  if (site === 'production' || site === 'staging' || site === 'development') return site;
  return env.VERCEL_ENV === 'production' ? 'production' : 'development';
}

export function robotsFor(
  siteEnv: SiteEnv,
  seo: { robots: 'index' | 'noindex' },
  appUrl: string,
): MetadataRoute.Robots {
  // Keep previews, staging and a switched-off site out of the index entirely.
  if (siteEnv !== 'production' || seo.robots === 'noindex') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  const origin = appUrl.replace(/\/+$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/login', '/unauthorized', '/maintenance', '/*?*'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
