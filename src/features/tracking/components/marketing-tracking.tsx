import { bootstrapScript } from '@/lib/tracking/bootstrap';
import { ConsentBanner } from '@/features/consent/components/consent-banner';

import { loadTrackingFrame } from '../server/load-frame';
import { ClickTracker } from './click-tracker';
import { CustomScripts } from './custom-scripts';
import { MarketingScripts } from './marketing-scripts';
import { RouteTracker } from './route-tracker';
import { TrackingBootstrap } from './tracking-bootstrap';

// The whole public tracking frame. Renders nothing at all unless consent is on
// and there is something to consent to, or a necessary snippet exists.
export async function MarketingTracking() {
  const { frame, consent } = await loadTrackingFrame();
  if (!frame.active && frame.scripts.length === 0) return null;
  return (
    <>
      {frame.active && <TrackingBootstrap script={bootstrapScript(frame)} />}
      {frame.scripts.length > 0 && <CustomScripts snippets={frame.scripts} />}
      {frame.active && (
        <>
          <RouteTracker />
          <ClickTracker />
          <MarketingScripts pixelId={frame.pixelId} />
          <ConsentBanner policy={frame.policy} copy={consent} />
        </>
      )}
    </>
  );
}
