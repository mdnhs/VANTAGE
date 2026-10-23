import { loadTrackingFrame } from '../server/load-frame';
import { CookieSettingsButton } from './cookie-settings-button';

// The footer's "Cookie settings" trigger, only while the banner is live.
export async function CookieSettingsSlot() {
  const { frame, consent } = await loadTrackingFrame();
  if (!frame.active) return null;
  return <CookieSettingsButton label={consent.settingsLink} />;
}
