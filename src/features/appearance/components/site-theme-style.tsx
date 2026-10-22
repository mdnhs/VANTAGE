import { siteThemeCss } from '@/lib/theme/css';
import type { SiteThemeConfig } from '@/lib/theme/schema';
import { getSiteThemeForRender } from '@/server/queries/get-theme';

import { PreviewBar } from './preview-bar';

// Pure markup: the default theme emits nothing, so default pages stay byte-identical.
export function SiteThemeMarkup({ site, preview }: { site: SiteThemeConfig; preview: boolean }) {
  const css = siteThemeCss(site);
  return (
    <>
      {css ? <style id='theme-tokens'>{css}</style> : null}
      {preview ? <PreviewBar /> : null}
    </>
  );
}

// The published site theme (or the draft, in draft mode) for the public pages. Reads the cached
// getSiteThemeForRender, so marketing routes stay statically prerendered.
export async function SiteThemeStyle() {
  const { site, preview } = await getSiteThemeForRender();
  return <SiteThemeMarkup site={site} preview={preview} />;
}
