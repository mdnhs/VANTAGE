import 'server-only';

import type { GlobalValue } from '@/lib/content/globals';
import { serverEnv } from '@/lib/env';
import { trackingFrame, type TrackingFrame } from '@/lib/tracking/frame';
import { getPublicTracking } from '@/server/queries/get-public-tracking';
import { getTrackingPreview } from '@/server/queries/get-tracking-preview';
import { getSetting } from '@/server/queries/get-setting';

// Decided from the cached, tagged readers, so marketing pages stay statically prerendered:
// saving tracking, consent or scripts expires those tags. DISABLE_CUSTOM_SCRIPTS is read at
// prerender time, so changing it needs a rebuild or redeploy (clearing the snippets in Custom
// code is the instant kill switch). Appearance previews (draft mode) bypass the cache and render
// no tracking at all.
export async function loadTrackingFrame(): Promise<{ frame: TrackingFrame; consent: GlobalValue<'consent'> }> {
  const [consent, scripts, tracking, preview] = await Promise.all([
    getSetting('consent'),
    getSetting('scripts'),
    getPublicTracking(),
    getTrackingPreview(),
  ]);
  const scriptsDisabled = serverEnv().DISABLE_CUSTOM_SCRIPTS === true;
  return { frame: trackingFrame({ consent, scripts, tracking, scriptsDisabled, preview }), consent };
}
