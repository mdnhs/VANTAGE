import type { GlobalValue } from '@/lib/content/globals';
import type { ScriptSnippet } from '@/lib/content/globals-marketing';

import type { ConsentPolicy } from './consent';

export type PublicTracking = {
  gtmId: string | null;
  ga4Id: string | null;
  pixelId: string | null;
};

export type TrackingFrame = {
  active: boolean;
  policy: ConsentPolicy;
  gtmId: string | null;
  ga4Id: string | null;
  pixelId: string | null;
  scripts: ScriptSnippet[];
};

// Decided once per render, from cached settings only.
export function trackingFrame(input: {
  consent: GlobalValue<'consent'>;
  scripts: GlobalValue<'scripts'>;
  tracking: PublicTracking;
  scriptsDisabled: boolean;
}): TrackingFrame {
  const { consent, tracking } = input;
  const runnable = input.scriptsDisabled ? [] : input.scripts.snippets.filter((s) => s.enabled);
  const gated = runnable.some((s) => s.category !== 'necessary');
  const active = consent.enabled && Boolean(tracking.gtmId || tracking.pixelId || gated);
  return {
    active,
    policy: { version: consent.version, months: consent.reconsentMonths },
    gtmId: active ? tracking.gtmId : null,
    ga4Id: active && tracking.gtmId ? tracking.ga4Id : null,
    pixelId: active ? tracking.pixelId : null,
    scripts: active ? runnable : runnable.filter((s) => s.category === 'necessary'),
  };
}
