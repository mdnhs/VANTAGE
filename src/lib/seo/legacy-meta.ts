import type { GlobalValue } from '@/lib/content/globals';
import type { PublicSiteSettings } from '@/server/services/site-settings-service';

// The public settings carry the legacy meta title, description and Twitter handle until `settings:migrate`
// has run (and treat a value equal to the derived one as "not set"), so the site-wide SEO defaults take them from there.
// Shared by the shipped metadata, the SEO health report and the SEO tab so all three grade the same text.
export function withLegacyMeta(
  defaults: GlobalValue<'seo'>,
  settings: Pick<PublicSiteSettings, 'metaTitle' | 'metaDescription' | 'twitterHandle'>,
): GlobalValue<'seo'> {
  return {
    ...defaults,
    defaultTitle: settings.metaTitle ?? '',
    defaultDescription: settings.metaDescription ?? '',
    twitterHandle: settings.twitterHandle ?? '',
  };
}
