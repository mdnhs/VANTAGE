import { cacheLife, cacheTag } from 'next/cache';
import { ImageResponse } from 'next/og';

import { siteNameFrom } from '@/lib/content/site-name';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { siteSettingsService } from '@/server/services/site-settings-service';

const size = { width: 1200, height: 630 };

// Cached so the card stays static; a save of the site global expires it.
async function siteName() {
  'use cache';
  cacheTag(settingTag('site'));
  cacheLife('max');
  try {
    return (await siteSettingsService.getPublic()).businessName;
  } catch {
    return siteNameFrom(null);
  }
}

// The generated share card, used when no share image is set (GENERATED_OG in lib/seo).
export async function GET() {
  const name = await siteName();
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#ffffff',
        fontSize: 96,
        fontWeight: 700,
      }}
    >
      {name}
    </div>,
    { ...size },
  );
}
