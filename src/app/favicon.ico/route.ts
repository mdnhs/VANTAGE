import { siteSettingsService } from '@/server/services/site-settings-service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } });

// /favicon.ico on the site's own domain, serving the uploaded favicon (else the logo). Google only
// picks up a favicon it can crawl from the same host; the media bucket's domain is not indexed.
export async function GET() {
  const settings = await siteSettingsService.getPublic().catch(() => null);
  const icon = settings?.favicon ?? settings?.logo;
  if (!icon) return NOT_FOUND();
  const upstream = await fetch(new URL(icon.src, APP_URL)).catch(() => null);
  if (!upstream?.ok) return NOT_FOUND();
  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? icon.mimeType ?? 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
