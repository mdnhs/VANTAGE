import 'server-only';

import { io } from 'next/cache';
import type { GlobalValue } from '@/lib/content/globals';
import { serverEnv } from '@/lib/env';
import { trackingFrame, type TrackingFrame } from '@/lib/tracking/frame';
import { getPublicTracking } from '@/server/queries/get-public-tracking';
import { getSetting } from '@/server/queries/get-setting';

// Decided once per render from cached settings. `io()` first: the kill switch
// is read from the environment at request time, never inside a cached function.
export async function loadTrackingFrame(): Promise<{ frame: TrackingFrame; consent: GlobalValue<'consent'> }> {
  await io();
  const [consent, scripts, tracking] = await Promise.all([
    getSetting('consent'),
    getSetting('scripts'),
    getPublicTracking(),
  ]);
  const scriptsDisabled = serverEnv().DISABLE_CUSTOM_SCRIPTS === true;
  return { frame: trackingFrame({ consent, scripts, tracking, scriptsDisabled }), consent };
}
