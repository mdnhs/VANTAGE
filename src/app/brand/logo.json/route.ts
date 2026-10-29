import { getSetting } from '@/server/queries/get-setting';

// The animated logo document; pages link it by a versioned URL (lottieLogoSrc), so it is cached for good.
export async function GET() {
  const { lottieLogo } = await getSetting('site');
  const json = lottieLogo.json?.trim();
  if (!lottieLogo.enabled || !json) return new Response('Not found', { status: 404 });
  return new Response(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
