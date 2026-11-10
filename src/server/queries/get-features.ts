import 'server-only';

import { getSetting } from '@/server/queries/get-setting';

// The admin's "Show the Insurance page" switch (Settings → Business). Tag-cached with the site
// document, so flipping it in the admin takes effect on the next request.
export async function getInsuranceEnabled(): Promise<boolean> {
  return (await getSetting('site')).features.insurance;
}
