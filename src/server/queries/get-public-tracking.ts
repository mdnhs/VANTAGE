import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { parseTracking, type TrackingValue } from '@/lib/content/globals-marketing';
import type { PublicTracking } from '@/lib/tracking/frame';
import { GA4_ID, GTM_ID, PIXEL_ID, validId } from '@/lib/tracking/ids';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { settingsRepository } from '@/server/repositories/settings-repository';

// Validated ids only: the token and the test code never reach this value.
export function publicTrackingFrom(t: TrackingValue): PublicTracking {
  const gtmId = t.enabled.gtm ? validId(GTM_ID, t.gtmId) : null;
  return {
    gtmId,
    ga4Id: gtmId && t.enabled.ga4 ? validId(GA4_ID, t.ga4Id) : null,
    pixelId: t.enabled.meta ? validId(PIXEL_ID, t.metaPixelId) : null,
  };
}

// The public half of the `tracking` settings row, cached until a save expires
// its tag. Callers must `await io()` first.
export async function getPublicTracking(): Promise<PublicTracking> {
  'use cache';
  cacheTag(settingTag('tracking'));
  cacheLife('max');
  const row = await settingsRepository.get('tracking');
  return publicTrackingFrom(parseTracking(row?.value));
}
