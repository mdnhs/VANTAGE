import 'server-only';

import { cacheLife } from 'next/cache';
import { draftMode } from 'next/headers';

// True while the Appearance preview (draft mode) renders. Same shape as getSiteThemeForRender:
// draft mode bypasses the cache, so the shared entry stays `false` and marketing pages remain
// statically prerendered.
export async function getTrackingPreview(): Promise<boolean> {
  'use cache';
  cacheLife('max');
  return (await draftMode()).isEnabled;
}
